import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ActionSheetController } from '@ionic/angular';
import { ToastService } from 'src/app/services/toast/toast.service';
import { DataService } from 'src/app/services/data/data.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditPage implements OnInit {

  edit_profile_form: FormGroup;
  submit_attempt: boolean = false;
  userId: number | null = null;
  userEmail = '';

  constructor(
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private navController: NavController,
    private actionSheetController: ActionSheetController,
    private dataService: DataService,
    private storage: Storage
  ) { }

  async ngOnInit() {
    this.edit_profile_form = this.formBuilder.group({
      name_first: ['', Validators.required],
      name_last: ['', Validators.required]
    });

    await this.storage.create();
    this.userId = await this.storage.get('user_id');

    if (this.userId) {
      await this.loadProfile();
    } else {
      this.toastService.presentToast('Error', 'User ID not found. Please login again.', 'top', 'danger', 3000);
      this.navController.navigateBack('/signin');
    }
  }

  async loadProfile() {
    // Prova a leggere da storage locale
    const localProfile = await this.storage.get('user_profile');
    if (localProfile) {
      this.edit_profile_form.patchValue({
        name_first: localProfile.name_first,
        name_last: localProfile.name_last
      });
    }

    // Poi aggiorna con dati freschi dal backend
    this.dataService.getProfile(this.userId).subscribe({
      next: (res: any) => {
        if (res.success && res.user) {
          this.edit_profile_form.patchValue({
            name_first: res.user.name_first,
            name_last: res.user.name_last
          });
          this.userEmail = res.user.email;

          // Aggiorna storage con dati freschi
          this.storage.set('user_profile', {
            name_first: res.user.name_first,
            name_last: res.user.name_last
          });
        } else {
          this.toastService.presentToast('Error', 'Unable to load profile', 'top', 'danger', 2000);
        }
      },
      error: () => {
        this.toastService.presentToast('Error', 'Network error', 'top', 'danger', 2000);
      }
    });
  }

  async updateProfilePicture() {
    // Logica immutata o da implementare
  }

  submit() {
    this.submit_attempt = true;

    if (this.edit_profile_form.valid && this.userId) {
      const data = {
        user_id: this.userId,
        ...this.edit_profile_form.value
      };

      this.dataService.updateProfile(data).subscribe({
        next: async (res: any) => {
          if (res.success) {
            // Aggiorna storage locale con dati appena salvati
            await this.storage.set('user_profile', {
              name_first: data.name_first,
              name_last: data.name_last
            });

            this.toastService.presentToast('Success', 'Profile saved', 'top', 'success', 2000);
            this.navController.back();
          } else {
            this.toastService.presentToast('Error', res.message || 'Update failed', 'top', 'danger', 2000);
          }
        },
        error: () => {
          this.toastService.presentToast('Error', 'Network error', 'top', 'danger', 2000);
        }
      });
    } else {
      this.toastService.presentToast('Error', 'Please fill in all required fields', 'top', 'danger', 2000);
    }
  }

}
