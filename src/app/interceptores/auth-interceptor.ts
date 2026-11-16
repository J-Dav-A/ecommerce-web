import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../servicios/auth';
import { NotificacionesService } from '../servicios/notificaciones';

// Se escribe una sola vez y se aplica a TODAS las peticiones: ningún servicio ni pantalla
// escribe el encabezado Authorization a mano.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const avisos = inject(NotificacionesService);
  const token = auth.getToken();

  // 1) Si hay sesión, agrega Authorization: Bearer <token>
  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // 2) Mira lo que devuelve el backend: un 401 con sesión iniciada significa token vencido o inválido
  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token && !req.url.includes('/auth/login')) {
        auth.logout();
        avisos.error('Tu sesión venció. Inicia sesión nuevamente.');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};