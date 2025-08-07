import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private apiBaseUrl = 'https://pannellogaleazzi.appnativeitalia.com/api';

  constructor(private http: HttpClient) {}

  // =======================
  // Servizi relativi al profilo utente
  // =======================

  getProfile(userId: number): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/profile.php?user_id=${userId}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }

  updateProfile(data: { user_id: number; name_first: string; name_last: string }): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/profile_update.php`, data);
  }

  // =======================
  // Servizi relativi al questionario
  // =======================

  // Recupera i dati del questionario per un utente specifico
  getQuestionario(userId: number): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/questionario.php?user_id=${userId}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }

  // Invia/aggiorna i dati del questionario
  postQuestionario(data: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/questionario.php`, data);
  }

  // =======================
  // Nuovo servizio: recupera le domande dinamiche del questionario
  // =======================

  getDomandeQuestionario(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/get_domande.php`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }

}
