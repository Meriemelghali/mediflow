import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  /**
   * Vérifie si l'utilisateur est connecté en vérifiant la présence du token.
   */
  isLoggedIn(): boolean {
    // ⚠️ TEMPORAIRE : retourne toujours true pour que vous puissiez voir le layout 
    // sans avoir encore de page de login.
    // À remplacer par votre vraie logique plus tard :
    // return !!localStorage.getItem('accessToken');
    return true;
  }
}
