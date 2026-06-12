import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.getCurrentUser();
  if (user && user.roles && user.roles.includes('ADMIN')) {
    return true;
  }
  
  router.navigate(['/dashboard/appointments']);
  return false;
};
