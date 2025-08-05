import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private router: Router,
    private http: HttpClient,
    private storage: Storage // <-- ora si inietta direttamente
  ) {
    this.init();
  }

  private async init() {
    await this.storage.create(); // inizializza lo storage
  }

  async getSession() {
    const token = await this.storage.get('auth_token');
    if (token) {
      return { token };
    }
    return false;
  }

  signIn(email: string, password: string) {
    return this.http.post('https://pannellogaleazzi.appnativeitalia.com/api/login.php', { email, password })
      .toPromise()
      .then(async (res: any) => {
        if (res.success && res.token) {
          await this.storage.set('auth_token', res.token);
          return res;
        }
        throw new Error('Invalid credentials');
      });
  }

  async signOut() {
    await this.storage.remove('auth_token');
    this.router.navigateByUrl('/signin');
  }
}
