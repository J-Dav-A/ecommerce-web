
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../servicios/auth';
import { NotificacionesService } from '../servicios/notificaciones';
import { Rol } from '../modelos/auth';

// Permite el acceso únicamente a usuarios autenticados.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

// Permite el acceso únicamente a usuarios que no han iniciado sesión.
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/']);
};

// Permite el acceso únicamente al rol indicado.
export const rolGuard = (rol: Rol): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const avisos = inject(NotificacionesService);

  if (auth.tieneRol(rol)) {
    return true;
  }

  avisos.error('No tienes permiso para entrar a esa sección.');
  return router.createUrlTree(['/']);
};
