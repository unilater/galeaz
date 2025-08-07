import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definizione dell'interfaccia per la risposta AI Details
interface AiDetailsResponse {
  success: boolean;
  data: Record<string, string>;
}

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
    return this.http.get(
      `${this.apiBaseUrl}/profile.php?user_id=${userId}`,
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  }

  updateProfile(data: { user_id: number; name_first: string; name_last: string }): Observable<any> {
    return this.http.post(
      `${this.apiBaseUrl}/profile_update.php`,
      data
    );
  }

  // =======================
  // Servizi relativi al questionario
  // =======================

  getQuestionario(userId: number): Observable<any> {
    return this.http.get(
      `${this.apiBaseUrl}/questionario.php?user_id=${userId}`,
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  }

  postQuestionario(data: any): Observable<any> {
    return this.http.post(
      `${this.apiBaseUrl}/questionario.php`,
      data
    );
  }

  // =======================
  // Servizio per recuperare le domande del questionario
  // =======================

  getDomandeQuestionario(): Observable<any> {
    return this.http.get(
      `${this.apiBaseUrl}/get_domande.php`,
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  }

  // =======================
  // Servizi per AI: inizializzazione e dettaglio
  // =======================

  inizializzaAI(userId: number): Observable<any> {
    return this.http.get(
      `${this.apiBaseUrl}/openai/inizializza.php?user_id=${userId}`,
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  }

  attivaTutele(userId: number): Observable<any> {
    return this.http.get(
      `${this.apiBaseUrl}/openai/tutele.php?user_id=${userId}`,
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  }

  /**
   * Recupera le tutele AI generate per l'utente
   * Ritorna: { success: boolean, data: { [key: string]: html } }
   */
  getAiDetails(userId: number): Observable<AiDetailsResponse> {
    return this.http.get<AiDetailsResponse>(
      `${this.apiBaseUrl}/openai/get_tutele.php?user_id=${userId}`,
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  }
}

