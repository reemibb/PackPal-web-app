// src/app/connect.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectService {

  private baseUrl = 'http://localhost/final-asp-php/';

  constructor(private http: HttpClient) { }

  login(data: any): Observable<any> { 
    return this.http.post(this.baseUrl + 'login.php', data);
  }

  getLogoUrl(): Observable<any> {
  return this.http.get<any>(this.baseUrl + 'get_logo.php');
  }

  signup(data: any): Observable<any> {
    return this.http.post(this.baseUrl + 'register.php', data);
  }

  getBodyImages() {
  return this.http.get<any>(this.baseUrl + 'get_body_images.php');
}

getBodyContent() {
  return this.http.get<any>(this.baseUrl + 'get_body_content.php');
}

getMainContent() {
  return this.http.get<any>(this.baseUrl + 'get_main_content.php');
}

subscribeUser(userId: number, email: string) {
  return this.http.post(this.baseUrl + 'subscribe.php', {
    user_id: userId,
    email: email
  });
}

getGenerateContent() {
  return this.http.get<any>(this.baseUrl + 'get_generate_content.php');
}

getCountries() {
  return this.http.get<any>(this.baseUrl + 'get_countries.php');
}






}
