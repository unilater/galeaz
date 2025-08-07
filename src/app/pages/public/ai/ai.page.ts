import { Component } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { DataService } from 'src/app/services/data/data.service';

@Component({
  selector: 'app-ai',
  templateUrl: './ai.page.html',
  styleUrls: ['./ai.page.scss'],
})
export class AiPage {

  message: string | null = null;
  aiResponse: any = null;
  tuteleResponse: any = null;
  userId: number | null = null;

  constructor(
    private dataService: DataService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private storage: Storage
  ) {}

  async inizializzaAI() {
    await this.storage.create();
    this.userId = await this.storage.get('user_id');

    if (!this.userId) {
      this.presentToast('Errore: user_id non trovato', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Inizializzazione in corso...',
      spinner: 'crescent'
    });
    await loading.present();

    this.dataService.inizializzaAI(this.userId).subscribe({
      next: async (res: any) => {
        await loading.dismiss();

        if (res.success) {
          this.message = 'Inizializzazione completata con successo!';
          this.aiResponse = res.data;
          this.presentToast(this.message, 'success');
        } else {
          this.message = 'Errore: ' + (res.message || 'Problema durante l\'inizializzazione.');
          this.presentToast(this.message, 'danger');
        }
      },
      error: async () => {
        await loading.dismiss();
        this.message = 'Errore di rete o server non raggiungibile.';
        this.presentToast(this.message, 'danger');
      }
    });
  }

  async attivaTutele() {
    await this.storage.create();
    this.userId = await this.storage.get('user_id');

    if (!this.userId) {
      this.presentToast('Errore: user_id non trovato', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Attivazione tutele in corso...',
      spinner: 'crescent'
    });
    await loading.present();

    this.dataService.attivaTutele(this.userId).subscribe({
      next: async (res: any) => {
        await loading.dismiss();

        if (res.success) {
          this.message = 'Tutele attivate con successo!';
          this.tuteleResponse = res.data;
          this.presentToast(this.message, 'success');
        } else {
          this.message = 'Errore: ' + (res.message || 'Problema durante l\'attivazione tutele.');
          this.presentToast(this.message, 'danger');
        }
      },
      error: async () => {
        await loading.dismiss();
        this.message = 'Errore di rete o server non raggiungibile.';
        this.presentToast(this.message, 'danger');
      }
    });
  }

  private async presentToast(msg: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }
}
