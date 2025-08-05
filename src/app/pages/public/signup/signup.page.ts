import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {

  current_year: number = new Date().getFullYear();

  signup_form: FormGroup;
  submit_attempt: boolean = false;

  constructor(
    private authService: AuthService,
    private loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit() {
    // Setup form
    this.signup_form = this.formBuilder.group({
      email: ['', Validators.compose([Validators.email, Validators.required])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])],
      password_repeat: ['', Validators.compose([Validators.minLength(6), Validators.required])]
    });

    // DEBUG: Prefill inputs
    this.signup_form.get('email').setValue('john.doe@mail.com');
    this.signup_form.get('password').setValue('123456');
  }

  // Sign up
  async signUp() {

    this.submit_attempt = true;

    if (this.signup_form.invalid) {
      this.toastService.presentToast('Error', 'Please fill in all fields correctly', 'top', 'danger', 4000);
      return;
    }

    if (this.signup_form.value.password !== this.signup_form.value.password_repeat) {
      this.toastService.presentToast('Error', 'Passwords must match', 'top', 'danger', 4000);
      return;
    }

    // Proceed with loading overlay
    const loading = await this.loadingController.create({
      cssClass: 'default-loading',
      message: '<p>Signing up...</p><span>Please be patient.</span>',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const res = await this.authService.signUp(this.signup_form.value.email, this.signup_form.value.password);
      await loading.dismiss();

      if (res.success) {
        this.toastService.presentToast('Welcome!', 'Account created successfully', 'top', 'success', 2000);
        this.router.navigate(['/home']);
      } else {
        this.toastService.presentToast('Error', res.message || 'Signup failed', 'top', 'danger', 3000);
      }
    } catch (e) {
      await loading.dismiss();
      this.toastService.presentToast('Error', 'Network or server error', 'top', 'danger', 3000);
    }
  }
}
