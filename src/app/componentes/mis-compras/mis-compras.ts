import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ComprasService } from '../../servicios/compras';
import { NotificacionesService } from '../../servicios/notificaciones';
import { Compra } from '../../modelos/compras';

// Historial del comprador: ver compras, confirmarlas o pedir reembolso (flujo de pago simulado)
@Component({
  selector: 'app-mis-compras',
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './mis-compras.html',
  styleUrl: './mis-compras.css'
})
export class MisCompras implements OnInit {
  private comprasService = inject(ComprasService);
  private avisos = inject(NotificacionesService);
  private destroyRef = inject(DestroyRef);

  compras = signal<Compra[]>([]);
  cargando = signal(true);
  error = signal('');
  trabajando = signal<string | null>(null);   // id de la compra en proceso
  reembolsando = signal<string | null>(null); // id de la compra con el formulario de motivo abierto
  motivo = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.comprasService.misCompras()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => { this.compras.set(lista); this.cargando.set(false); },
        error: (err: HttpErrorResponse) => { this.error.set(this.traducirError(err)); this.cargando.set(false); }
      });
  }

  confirmar(compra: Compra): void {
    this.trabajando.set(compra.id);
    this.comprasService.confirmar(compra.id).subscribe({
      next: () => { this.avisos.exito('Compra confirmada.'); this.trabajando.set(null); this.cargar(); },
      error: (err: HttpErrorResponse) => { this.avisos.error(this.traducirError(err)); this.trabajando.set(null); }
    });
  }

  abrirReembolso(compra: Compra): void {
    this.motivo = '';
    this.reembolsando.set(compra.id);
  }

  enviarReembolso(compra: Compra): void {
    if (!this.motivo.trim()) {
      this.avisos.error('Escribe el motivo del reembolso.');
      return;
    }
    this.trabajando.set(compra.id);
    this.comprasService.reembolso(compra.id, this.motivo.trim()).subscribe({
      next: () => {
        this.avisos.exito('Reembolso solicitado.');
        this.trabajando.set(null);
        this.reembolsando.set(null);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => { this.avisos.error(this.traducirError(err)); this.trabajando.set(null); }
    });
  }

  private traducirError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400: return err.error?.mensaje ?? 'Los datos enviados no son válidos.';
      case 401: return 'Tu sesión venció. Inicia sesión nuevamente.';
      case 403: return 'Solo las cuentas de comprador tienen compras.';
      case 404: return 'La compra no existe.';
      case 422: return err.error?.mensaje ?? 'No se pudo completar la operación.';
      case 0: return 'No se pudo conectar con el servidor. ¿Está encendido el backend?';
      default: return 'Ocurrió un error. Intenta de nuevo más tarde.';
    }
  }
}
