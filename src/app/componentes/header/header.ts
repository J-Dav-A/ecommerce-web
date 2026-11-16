import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../servicios/auth';
import { NotificacionesService } from '../../servicios/notificaciones';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  private router = inject(Router);
  private avisos = inject(NotificacionesService);
  protected auth = inject(AuthService);

  cerrarSesion(): void {
    this.auth.logout();
    this.avisos.info('Cerraste sesión');
    this.router.navigate(['/']);
  }
}