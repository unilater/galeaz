import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface TutelaCompletamento {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private apiBaseUrl = 'https://pannellogaleazzi.appnativeitalia.com/api';

  constructor(private http: HttpClient) {}

  // Ottiene dati base profilo utente
  getProfile(userId: number): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/profile.php?user_id=${userId}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }

  // Aggiorna dati profilo utente (nome e cognome)
  updateProfile(data: { user_id: number; name_first: string; name_last: string }): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/profile_update.php`, data);
  }

  // Ottiene i dati completi delle tutele per l'utente
  getTutele(userId: number): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/get_tutele.php?user_id=${userId}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }

  // Chiama l'endpoint che aggiorna la singola colonna della tabella tutele
  updateColumn(userId: number, column: string): Observable<any> {
    const payload = { user_id: userId, column: column };
    return this.http.post(`${this.apiBaseUrl}/aggiorna_tutele.php`, payload);
  }

  // Ottiene stato completamento delle tutele per l'utente
  getTuteleCompletamento(userId: number): Observable<TutelaCompletamento> {
    return this.http.get<TutelaCompletamento>(`${this.apiBaseUrl}/get_tutele_completamento.php?user_id=${userId}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }

  // Segna una tutela come completata nel database
  setTutelaCompletata(userId: number, column: string): Observable<any> {
    const payload = { user_id: userId, column: column };
    return this.http.post(`${this.apiBaseUrl}/set_tutela_completata.php`, payload);
  }
}
