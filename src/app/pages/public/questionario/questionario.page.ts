import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
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

  questionarioForm: FormGroup = new FormGroup({});
  userId: number | null = null;
  isSubmitted = false;
  isComplete = false;
  questions: any[] = [];
  private routerSubscription: Subscription | null = null;

  constructor(
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private storage: Storage,
    private dataService: DataService
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.userId = await this.storage.get('user_id');
    if (!this.userId) {
      this.presentToast('Errore: user_id non trovato', 'danger');
      this.router.navigate(['/signin']);
      return;
    }

    await this.loadDomande();
    await this.loadUserData();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url === '/questionario') {
          this.loadUserData();
        }
      });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  private async loadDomande() {
    const loading = await this.loadingCtrl.create({
      message: 'Caricamento domande...',
      spinner: 'crescent'
    });
    await loading.present();

    this.dataService.getDomandeQuestionario().pipe(
      finalize(() => loading.dismiss())
    ).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          // ORDINA PER id CRESCENTE
          this.questions = res.data.sort((a: any, b: any) => a.id - b.id);

          // Costruisci formGroup dinamico
          const group: { [key: string]: FormControl } = {};
          this.questions.forEach(q => {
            const validators = q.obbligatoria ? [Validators.required] : [];
            if (q.tipo === 'number') {
              validators.push(Validators.min(0));
            }
            group[q.id.toString()] = new FormControl('', validators);
          });
          this.questionarioForm = new FormGroup(group);
        } else {
          this.presentToast('Errore nel caricamento domande', 'danger');
        }
      },
      error: () => this.presentToast('Errore di rete durante caricamento domande', 'danger')
    });
  }

  private async loadUserData() {
    if (!this.userId) return;

    const loading = await this.loadingCtrl.create({
      message: 'Caricamento dati...',
      spinner: 'crescent'
    });
    await loading.present();

    this.dataService.getQuestionario(this.userId).pipe(
      finalize(() => loading.dismiss())
    ).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          Object.keys(res.data).forEach(key => {
            if (this.questionarioForm.controls[key]) {
              this.questionarioForm.controls[key].patchValue(res.data[key]);
            }
          });
          this.isComplete = false;
          this.questionarioForm.enable();
        } else {
          this.presentToast('Nessun dato trovato', 'warning');
        }
      },
      error: () => this.presentToast('Errore nel caricamento dei dati', 'danger')
    });
  }

  async submit() {
    if (this.isSubmitted || this.isComplete) return;
    if (this.questionarioForm.invalid) {
      this.presentToast('Compila tutti i campi obbligatori correttamente', 'danger');
      return;
    }

    this.isSubmitted = true;
    const loading = await this.loadingCtrl.create({
      message: 'Invio dati...',
      spinner: 'crescent'
    });
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
        } else {
          await this.presentToast('Errore nell\'invio dei dati', 'danger');
        }
      },
      error: async () => {
        await this.presentToast('Errore di rete, riprova più tardi', 'danger');
      }
    });
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

}
