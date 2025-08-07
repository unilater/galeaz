import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ToastController, LoadingController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { Subscription } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { DataService } from 'src/app/services/data/data.service';

@Component({
  selector: 'app-questionario',
  templateUrl: './questionario.page.html',
  styleUrls: ['./questionario.page.scss'],
})
export class QuestionarioPage implements OnInit, OnDestroy {

  questionarioForm: FormGroup;
  userId: number | null = null;
  isSubmitted = false;
  isComplete = false;  // Sempre false, per ora non gestito
  questions: any[] = [];
  private routerSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private storage: Storage,
    private dataService: DataService
  ) {}

  async ngOnInit() {
    await this.initStorage();

    await this.loadDomande();

    await this.loadUserIdAndData();

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url === '/questionario') {
        this.loadUserIdAndData();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
  }

  private async initStorage() {
    try {
      await this.storage.create();
    } catch (e) {
      console.error('Errore creazione storage:', e);
      await this.presentToast('Errore inizializzazione storage', 'danger');
    }
  }

  private async loadDomande() {
    const loading = await this.loadingCtrl.create({ message: 'Caricamento domande...', spinner: 'crescent' });
    await loading.present();

    this.dataService.getDomandeQuestionario().pipe(
      finalize(() => loading.dismiss())
    ).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.questions = res.data;

          // Costruisci form dinamicamente con validatori
          const group: { [key: string]: FormControl } = {};
          this.questions.forEach(q => {
            const validators = q.obbligatoria ? [Validators.required] : [];
            if (q.tipo === 'number') {
              validators.push(Validators.min(0));
            }
            group[q.id] = new FormControl('', validators);
          });
          this.questionarioForm = new FormGroup(group);
        } else {
          this.presentToast('Errore nel caricamento domande', 'danger');
        }
      },
      error: async () => {
        await this.presentToast('Errore di rete durante caricamento domande', 'danger');
      }
    });
  }

  private async loadUserIdAndData() {
    this.userId = await this.storage.get('user_id');
    if (!this.userId) {
      await this.presentToast('Errore: user_id non trovato', 'danger');
      return;
    }
    await this.loadUserData();
  }

  private async loadUserData() {
    const loading = await this.loadingCtrl.create({ message: 'Caricamento dati...', spinner: 'crescent' });
    await loading.present();

    this.dataService.getQuestionario(this.userId!).pipe(
      finalize(() => loading.dismiss())
    ).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          // res.data contiene già l’oggetto completo delle risposte
          Object.keys(res.data).forEach(key => {
            if (this.questionarioForm.controls[key]) {
              this.questionarioForm.controls[key].patchValue(res.data[key]);
            }
          });

          // Non gestiamo ancora isComplete
          this.isComplete = false;
          this.questionarioForm.enable();

        } else {
          this.presentToast('Nessun dato trovato', 'warning');
        }
      },
      error: async () => {
        await this.presentToast('Errore nel caricamento dei dati', 'danger');
      }
    });
  }

  async submit() {
    if (this.isSubmitted || this.isComplete) return;

    if (this.questionarioForm.invalid) {
      await this.presentToast('Compila tutti i campi obbligatori correttamente', 'danger');
      return;
    }

    this.isSubmitted = true;

    const loading = await this.loadingCtrl.create({ message: 'Invio dati...', spinner: 'crescent' });
    await loading.present();

    const payload = {
      user_id: this.userId,
      questionario: this.questionarioForm.value
    };

    this.dataService.postQuestionario(payload).pipe(
      finalize(() => {
        loading.dismiss();
        this.isSubmitted = false;
      })
    ).subscribe({
      next: async (res: any) => {
        if (res.success) {
          await this.presentToast('Dati inviati con successo!', 'success');
          // isComplete rimane false finché non gestito altrove
        } else {
          await this.presentToast('Errore nell\'invio dei dati', 'danger');
        }
      },
      error: async () => {
        await this.presentToast('Errore di rete, riprova più tardi', 'danger');
      }
    });
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
