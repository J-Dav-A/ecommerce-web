
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { OfertasService } from '../../servicios/ofertas';
import { ComprasService } from '../../servicios/compras';
import { NotificacionesService } from '../../servicios/notificaciones';
import { AuthService } from '../../servicios/auth';
import { Oferta } from '../../modelos/catalogo';

@Component({
  selector: 'app-comprar',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './comprar.html',
  styleUrl: './comprar.css'
})
export class Comprar implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ofertasService = inject(OfertasService);
  private comprasService = inject(ComprasService);
  private avisos = inject(NotificacionesService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  oferta = signal<Oferta | null>(null);
  cargandoOferta = signal(true);
  errorCarga = signal('');
  enviando = signal(false);
  errorMensaje = signal('');

  compraForm = inject(FormBuilder).nonNullable.group({
    ofertaId: ['', Validators.required],
    acepta: [false, Validators.requiredTrue]
  });

  get acepta() {
    return this.compraForm.controls.acepta;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.compraForm.controls.ofertaId.setValue(id);

    this.ofertasService.obtener(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (oferta) => {
          this.oferta.set(oferta);
          this.cargandoOferta.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorCarga.set(this.traducirError(err));
          this.cargandoOferta.set(false);
        }
      });
  }

  onSubmit(): void {
    if (this.compraForm.invalid) {
      this.compraForm.markAllAsTouched();
      return;
    }

    const compradorId = this.authService.usuario()?.usuarioId;

    if (!compradorId) {
      const mensaje = 'No se pudo identificar al comprador. Inicia sesión nuevamente.';
      this.errorMensaje.set(mensaje);
      this.avisos.error(mensaje);
      return;
    }

    this.errorMensaje.set('');
    this.enviando.set(true);

    this.comprasService.crear({
      ofertaId: this.compraForm.controls.ofertaId.value,
      compradorId: compradorId
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.avisos.exito('¡Compra registrada con éxito!');
          this.enviando.set(false);
          this.router.navigate(['/catalogo']);
        },
        error: (err: HttpErrorResponse) => {
          const mensaje = this.traducirError(err);
          this.errorMensaje.set(mensaje);
          this.avisos.error(mensaje);
          this.enviando.set(false);
        }
      });
  }

  private traducirError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400:
        return err.error?.mensaje ?? 'Los datos enviados no son válidos.';

      case 401:
        return 'Tu sesión venció. Inicia sesión nuevamente.';

      case 403:
        return 'Solo las cuentas de comprador pueden comprar. Ingresa con una cuenta de comprador.';

      case 404:
        return 'La oferta no existe o ya no está disponible.';

      case 422:
        return err.error?.mensaje ?? 'No se pudo completar la compra.';

      case 0:
        return 'No se pudo conectar con el servidor. ¿Está encendido el backend?';

      default:
        return 'Ocurrió un error. Intenta de nuevo más tarde.';
    }
  }
}
