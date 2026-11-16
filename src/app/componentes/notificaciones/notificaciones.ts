import { Component, inject } from '@angular/core';
import { NotificacionesService } from '../../servicios/notificaciones';

// Dibuja los avisos del servicio de notificaciones (esquina superior derecha)
@Component({
  selector: 'app-notificaciones',
  imports: [],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css'
})
export class Notificaciones {
  protected servicio = inject(NotificacionesService);

  clase(tipo: 'exito' | 'error' | 'info'): string {
    return { exito: 'alert-success', error: 'alert-danger', info: 'alert-info' }[tipo];
  }
}