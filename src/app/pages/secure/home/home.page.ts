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
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  content_loaded = false;
  userId: number | null = null;

  userProfile = {
    name_first: '',
    name_last: '',
    eta: null,
    email: ''
  };

  datiPresenti = false;

  sections: Section[] = [
    { title: 'Salute e Assistenza Sanitaria', content: `<ul><li>Agevolazioni per persone con diabete...</li></ul>` },
    { title: 'Famiglia e Relazioni', content: `<ul><li>Assegni familiari...</li></ul>` },
    { title: 'Lavoro e Reddito', content: `<ul><li>Sostegno al reddito per disoccupati...</li></ul>` },
    { title: 'Casa e Alloggio', content: `<ul><li>Agevolazioni per affitti e mutui...</li></ul>` },
    { title: 'Istruzione e Formazione', content: `<ul><li>Borse di studio...</li></ul>` },
    { title: 'Diritti Legali e Previdenza', content: `<ul><li>Consulenza legale gratuita...</li></ul>` },
    { title: 'Supporti e Servizi Sociali', content: `<ul><li>Centri di assistenza sociale...</li></ul>` }
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
      this.toastService.presentToast('Error', 'User not logged in', 'top', 'danger', 3000);
      this.router.navigate(['/signin']);
      return;
    }

    // Carica subito il profilo
    this.loadUserProfile();

    // Sottoscrivi evento navigazione per ricaricare dati ogni volta che torni su /home
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
        }
        this.content_loaded = true;
      },
      error: () => {
        this.content_loaded = true;
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

  toggleSection(index: number) {
    this.sections[index].expanded = !this.sections[index].expanded;
  }

}
