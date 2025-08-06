import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DataService } from 'src/app/services/data/data.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  userEmail = '';
  userName = '';
  userId: number | null = null;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private toastService: ToastService,
    private storage: Storage,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.storage.create();
    this.userId = await this.storage.get('user_id');

    if (!this.userId) {
      this.toastService.presentToast('Error', 'User not logged in', 'top', 'danger', 3000);
      await this.router.navigateByUrl('/signin');
      return;
    }

    this.loadProfile();
  }

  loadProfile() {
    this.dataService.getProfile(this.userId!).subscribe({
      next: (res: any) => {
        if (res.success && res.user) {
          this.userName = `${res.user.name_first} ${res.user.name_last}`;
          this.userEmail = res.user.email;
        } else {
          this.toastService.presentToast('Error', 'Unable to load profile', 'top', 'danger', 3000);
        }
      },
      error: () => {
        this.toastService.presentToast('Error', 'Network error', 'top', 'danger', 3000);
      }
    });
  }

  signOut() {
    this.authService.signOut();
  }
}

