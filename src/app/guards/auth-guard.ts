import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth';

// Deja pasar solo a quien tiene sesión; si no, lo manda al login.
// Ojo: es una comodidad para el usuario. La seguridad real la pone el backend, que valida el token en cada petición.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

// Deja pasar solo a quien NO tiene sesión (se usa en /login: quien ya inició sesión no necesita verlo)
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/']);
};