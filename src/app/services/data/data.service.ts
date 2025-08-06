import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private apiUrl = 'https://pannellogaleazzi.appnativeitalia.com/api';

  constructor(private http: HttpClient) { }

getProfile(userId: number) {
  return this.http.get(`${this.apiUrl}/profile.php?user_id=${userId}`, {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
  });
}

  // Aggiorna dati profilo con userId
  updateProfile(data: { user_id: number; name_first: string; name_last: string }) {
    return this.http.post(`${this.apiUrl}/profile_update.php`, data);
  }





}
