import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController, LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-questionario',
  templateUrl: './questionario.page.html',
  styleUrls: ['./questionario.page.scss'],
})
export class QuestionarioPage implements OnInit {

  questionarioForm: FormGroup;
  apiUrl = 'https://pannellogaleazzi.appnativeitalia.com/api/questionario.php';
  userId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private http: HttpClient,
    private router: Router,
    private storage: Storage
  ) { }

  async ngOnInit() {
    await this.storage.create();
    this.userId = await this.storage.get('user_id');

    this.questionarioForm = this.fb.group({
      eta: ['', [Validators.required, Validators.min(0), Validators.max(120)]],
      sesso: ['', Validators.required],
      statoCivile: ['', Validators.required],
      figli: [0, [Validators.required, Validators.min(0)]],
      patologie: [''],
      lavoro: ['', Validators.required]
    });
  }

  async submit() {
    if (this.questionarioForm.invalid) {
      const toast = await this.toastCtrl.create({
        message: 'Compila tutti i campi obbligatori correttamente',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      return;
    }

    if (!this.userId) {
      const toast = await this.toastCtrl.create({
        message: 'Utente non autenticato, esegui il login',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Invio dati...',
      spinner: 'crescent'
    });
    await loading.present();

    const payload = {
      user_id: this.userId,
      ...this.questionarioForm.value
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: async (res: any) => {
        await loading.dismiss();

        if (res.success) {
          // Salva in storage che questionario è completato
          await this.storage.set('questionario_completo', true);

          const toast = await this.toastCtrl.create({
            message: 'Questionario inviato con successo!',
            duration: 3000,
            color: 'success',
            position: 'top'
          });
          await toast.present();

          this.router.navigate(['/home']);
        } else {
          const toast = await this.toastCtrl.create({
            message: res.message || 'Errore durante l\'invio',
            duration: 3000,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
        }
      },
      error: async () => {
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'Errore di rete, riprova più tardi',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

}
