import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/services/data/data.service';
import { Router, NavigationEnd } from '@angular/router';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Storage } from '@ionic/storage-angular';
import { filter } from 'rxjs/operators';

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
    email: ''
  };

  questionarioCompletato = false;

  sections: Section[] = [
    { title: 'Salute e Assistenza Sanitaria', content: 'Contenuto fittizio per la sezione Salute e Assistenza Sanitaria.', key: 'salute' },
    { title: 'Famiglia e Relazioni', content: 'Contenuto fittizio per la sezione Famiglia e Relazioni.', key: 'famiglia' },
    { title: 'Lavoro e Reddito', content: 'Contenuto fittizio per la sezione Lavoro e Reddito.', key: 'lavoro' },
    { title: 'Casa e Alloggio', content: 'Contenuto fittizio per la sezione Casa e Alloggio.', key: 'casa' },
    { title: 'Istruzione e Formazione', content: 'Contenuto fittizio per la sezione Istruzione e Formazione.', key: 'istruzione' },
    { title: 'Diritti Legali e Previdenza', content: 'Contenuto fittizio per la sezione Diritti Legali e Previdenza.', key: 'diritti_legali' },
    { title: 'Supporti e Servizi Sociali', content: 'Contenuto fittizio per la sezione Supporti e Servizi Sociali.', key: 'servizi_sociali' }
  ];

  private routerSubscription: any;

  constructor(
    private dataService: DataService,
    private router: Router,
    private toastService: ToastService,
    private storage: Storage
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.userId = await this.storage.get('user_id');

    if (!this.userId) {
      this.toastService.presentToast('Errore', 'Utente non autenticato', 'top', 'danger', 3000);
      this.router.navigate(['/signin']);
      return;
    }

    await this.loadUserProfile();

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(async () => {
      if (this.router.url === '/home') {
        await this.loadUserProfile();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  async loadUserProfile() {
    this.content_loaded = false;
    this.showContent = false;

    this.dataService.getProfile(this.userId!).subscribe({
      next: (res: any) => {
        if (res.success && res.user) {
          this.userProfile = {
            name_first: res.user.name_first || '',
            name_last: res.user.name_last || '',
            email: res.user.email || ''
          };

          let questionarioData = {};
          if (res.user.questionario_data) {
            try {
              questionarioData = typeof res.user.questionario_data === 'string' ?
                JSON.parse(res.user.questionario_data) : res.user.questionario_data;
            } catch {
              questionarioData = {};
            }
          }

          // Considera completato se c'è almeno una chiave in questionario_data
          this.questionarioCompletato = Object.keys(questionarioData).length > 0;

          this.content_loaded = true;
          this.showContent = true;
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
    return !this.needsProfileCompletion && !this.questionarioCompletato;
  }

  goToProfile() {
    this.router.navigate(['/settings/profile/edit']);
  }

  goToQuestionario() {
    this.router.navigate(['/questionario']);
  }

  toggleSection(index: number) {
    this.sections[index].expanded = !this.sections[index].expanded;
  }

}
