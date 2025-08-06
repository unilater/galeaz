import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/services/data/data.service';
import { Router, NavigationEnd } from '@angular/router';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Storage } from '@ionic/storage-angular';
import { filter } from 'rxjs/operators';
import { LoadingController } from '@ionic/angular';

interface Section {
  title: string;
  content: string;
  expanded?: boolean;
  key: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  content_loaded = false;
  showContent = false;
  userId: number | null = null;

  userProfile = {
    name_first: '',
    name_last: '',
    eta: null,
    email: ''
  };

  datiPresenti = false;

  sections: Section[] = [
    { title: 'Salute e Assistenza Sanitaria', content: '', key: 'salute' },
    { title: 'Famiglia e Relazioni', content: '', key: 'famiglia' },
    { title: 'Lavoro e Reddito', content: '', key: 'lavoro' },
    { title: 'Casa e Alloggio', content: '', key: 'casa' },
    { title: 'Istruzione e Formazione', content: '', key: 'istruzione' },
    { title: 'Diritti Legali e Previdenza', content: '', key: 'diritti_legali' },
    { title: 'Supporti e Servizi Sociali', content: '', key: 'servizi_sociali' }
  ];

  tuteleCompletamento: Record<string, boolean> = {};

  private routerSubscription: any;

  constructor(
    private dataService: DataService,
    private router: Router,
    private toastService: ToastService,
    private storage: Storage,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.userId = await this.storage.get('user_id');

    if (!this.userId) {
      this.toastService.presentToast('Errore', 'Utente non autenticato', 'top', 'danger', 3000);
      this.router.navigate(['/signin']);
      return;
    }

    // Carica stato completamento questionario e tutele
    this.dataService.getTuteleCompletamento(this.userId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.tuteleCompletamento = res.data;
        }
        this.loadUserProfile();
      },
      error: () => {
        this.loadUserProfile();
      }
    });

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url === '/home') {
        this.loadUserProfile();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadUserProfile() {
    this.content_loaded = false;
    this.showContent = false; // Nascondi contenuti finché non verificato

    this.dataService.getProfile(this.userId!).subscribe({
      next: (res: any) => {
        if (res.success && res.user) {
          this.userProfile = {
            name_first: res.user.name_first || '',
            name_last: res.user.name_last || '',
            eta: res.user.eta || null,
            email: res.user.email || ''
          };
          this.datiPresenti = this.userProfile.eta !== null && this.userProfile.eta !== undefined && this.userProfile.eta !== '';

          if (this.needsQuestionarioCompletion) {
            this.toastService.presentToast('Attenzione', 'Completa il questionario per visualizzare i contenuti.', 'top', 'warning', 4000);
            this.content_loaded = true;
            this.showContent = false;
            return;
          }

          // Questionario completo, carica contenuti tutele
          this.dataService.getTutele(this.userId!).subscribe({
            next: (res2: any) => {
              if (res2.success && res2.data) {
                this.sections = this.sections.map(section => ({
                  ...section,
                  content: res2.data[section.key] || 'Nessuna informazione disponibile.'
                }));
              }
              this.content_loaded = true;
              this.showContent = true;
            },
            error: () => {
              this.content_loaded = true;
              this.showContent = true;
            }
          });
        } else {
          this.content_loaded = true;
          this.showContent = false;
        }
      },
      error: () => {
        this.content_loaded = true;
        this.showContent = false;
      }
    });
  }

  get needsProfileCompletion(): boolean {
    return this.userProfile.name_first.trim() === '' || this.userProfile.name_last.trim() === '';
  }

  get needsQuestionarioCompletion(): boolean {
    return !this.needsProfileCompletion && !this.datiPresenti;
  }

  goToProfile() {
    this.router.navigate(['/settings/profile/edit']);
  }

  goToQuestionario() {
    this.router.navigate(['/questionario']);
  }

  async toggleSection(index: number) {
    const section = this.sections[index];
    section.expanded = !section.expanded;

    if (section.expanded && !this.tuteleCompletamento[section.key]) {
      const loading = await this.loadingCtrl.create({
        message: `Aggiornamento ${section.title}...`,
        spinner: 'crescent'
      });
      await loading.present();

      this.dataService.updateColumn(this.userId!, section.key).subscribe({
        next: async (res: any) => {
          await loading.dismiss();

          if (res.message) {
            this.tuteleCompletamento[section.key] = true;
            await this.dataService.setTutelaCompletata(this.userId!, section.key).toPromise();
            section.content = res.content;
            this.toastService.presentToast('Successo', `${section.title} aggiornata`, 'bottom', 'success', 2000);
          }
        },
        error: async () => {
          await loading.dismiss();
          this.toastService.presentToast('Errore', `Errore aggiornamento ${section.title}`, 'bottom', 'danger', 3000);
        }
      });
    }
  }
}
