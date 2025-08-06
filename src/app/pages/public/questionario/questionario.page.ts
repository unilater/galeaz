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
  scriviTuteleUrl = 'https://pannellogaleazzi.appnativeitalia.com/api/scrivi_tutele.php';
  userId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private http: HttpClient,
    private router: Router,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.init();
  }

  async init() {
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

    if (this.userId) {
      this.loadUserData();
    }
  }

  capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  async loadUserData() {
    const loading = await this.loadingCtrl.create({
      message: 'Caricamento dati...',
      spinner: 'crescent'
    });
    await loading.present();

    this.http.get(`${this.apiUrl}?user_id=${this.userId}`).subscribe({
      next: async (res: any) => {
        console.log('Load user data response:', res);
        await loading.dismiss();
        if (res.success && res.data) {
          this.questionarioForm.patchValue({
            eta: res.data.eta,
            sesso: this.capitalizeFirstLetter(res.data.sesso),
            statoCivile: this.capitalizeFirstLetter(res.data.statoCivile),
            figli: res.data.figli,
            patologie: res.data.patologie,
            lavoro: res.data.lavoro
          });
        } else {
          const toast = await this.toastCtrl.create({
            message: 'Nessun dato trovato o errore nel caricamento',
            duration: 3000,
            color: 'warning',
            position: 'top'
          });
          await toast.present();
        }
      },
      error: async (err) => {
        console.error('Errore nel caricamento dati:', err);
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'Errore nel caricamento dei dati',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
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
        console.log('Submit questionario response:', res);
        if (!res || !res.success) {
          await loading.dismiss();
          const toast = await this.toastCtrl.create({
            message: res?.message || 'Errore durante l\'invio',
            duration: 3000,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
          return;
        }

        // Chiamata a scrivi_tutele.php
        const loadingTutele = await this.loadingCtrl.create({
          message: 'Salvataggio tutele...',
          spinner: 'crescent'
        });
        await loadingTutele.present();

        this.http.get(`${this.scriviTuteleUrl}?user_id=${this.userId}`).subscribe({
          next: async (res2: any) => {
            console.log('Scrivi tutele response:', res2);
            await loading.dismiss();
            await loadingTutele.dismiss();

            if (res2?.error) {
              const toast = await this.toastCtrl.create({
                message: 'Errore nel salvataggio delle tutele: ' + res2.error,
                duration: 4000,
                color: 'danger',
                position: 'top'
              });
              await toast.present();
              return;
            }

            const toast = await this.toastCtrl.create({
              message: 'Questionario e tutele salvati con successo!',
              duration: 3000,
              color: 'success',
              position: 'top'
            });
            await toast.present();

            await this.storage.set('questionario_completo', true);
            this.router.navigate(['/home']);
          },
          error: async (err) => {
            console.error('Errore nel salvataggio delle tutele:', err);
            await loading.dismiss();
            await loadingTutele.dismiss();
            const toast = await this.toastCtrl.create({
              message: 'Errore nel salvataggio delle tutele',
              duration: 3000,
              color: 'danger',
              position: 'top'
            });
            await toast.present();
          }
        });
      },
      error: async (err) => {
        console.error('Errore di rete invio questionario:', err);
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

