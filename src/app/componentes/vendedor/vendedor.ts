import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap, of } from 'rxjs';
import { OfertasService } from '../../servicios/ofertas';
import { ArchivosService } from '../../servicios/archivos';
import { NotificacionesService } from '../../servicios/notificaciones';
import { Oferta, Plataforma } from '../../modelos/catalogo';

// Panel del vendedor: solo entra quien tiene rol VENDEDOR (rolGuard en las rutas).
@Component({
  selector: 'app-vendedor',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './vendedor.html',
  styleUrl: './vendedor.css'
})
export class Vendedor implements OnInit {
  private ofertasService = inject(OfertasService);
  private archivos = inject(ArchivosService);
  private avisos = inject(NotificacionesService);
  private destroyRef = inject(DestroyRef);

  ofertas = signal<Oferta[]>([]);
  cargando = signal(true);
  errorLista = signal('');
  enviando = signal(false);
  errorMensaje = signal('');
  imagen = signal<File | null>(null); // imagen opcional que se sube a Cloudinary

  readonly plataformas: Plataforma[] = ['PC', 'PLAYSTATION', 'XBOX', 'NINTENDO'];

  // Formulario reactivo con validaciones (espejo de las del backend)
  ofertaForm = inject(FormBuilder).nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    precioValor: [null as number | null, [Validators.required, Validators.min(0.01)]],
    precioMoneda: ['USD', Validators.required],
    stock: [1, [Validators.required, Validators.min(0)]],
    plataforma: ['PC' as Plataforma, Validators.required]
  });

  get titulo() { return this.ofertaForm.controls.titulo; }
  get precioValor() { return this.ofertaForm.controls.precioValor; }
  get stock() { return this.ofertaForm.controls.stock; }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.ofertasService.misOfertas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => { this.ofertas.set(lista); this.cargando.set(false); },
        error: (err: HttpErrorResponse) => { this.errorLista.set(this.traducirError(err)); this.cargando.set(false); }
      });
  }

  elegirImagen(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    this.imagen.set(entrada.files?.[0] ?? null);
  }

  onSubmit(): void {
    if (this.ofertaForm.invalid) {
      this.ofertaForm.markAllAsTouched();
      return;
    }
    this.errorMensaje.set('');
    this.enviando.set(true);

    const v = this.ofertaForm.getRawValue();
    const datos = { titulo: v.titulo.trim(), precioValor: Number(v.precioValor), precioMoneda: v.precioMoneda,
                    stock: Number(v.stock), plataforma: v.plataforma };
    const archivo = this.imagen();

    // 1) publica la oferta; 2) si eligió imagen, la sube a Cloudinary y la asocia a la oferta
    this.ofertasService.publicar(datos).pipe(
      switchMap(creada => archivo
        ? this.archivos.subirImagen(archivo).pipe(
            switchMap(url => this.ofertasService.editar(creada.id, { ...datos, imagenes: [url] })))
        : of(creada)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.avisos.exito('¡Oferta publicada con éxito!');
        this.enviando.set(false);
        this.imagen.set(null);
        this.ofertaForm.reset({ titulo: '', precioValor: null, precioMoneda: 'USD', stock: 1, plataforma: 'PC' });
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = this.traducirError(err);
        this.errorMensaje.set(mensaje);
        this.avisos.error(mensaje);
        this.enviando.set(false);
        this.cargar(); // la oferta pudo crearse aunque falle la imagen
      }
    });
  }

  private traducirError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400: return err.error?.mensaje ?? 'Los datos enviados no son válidos.';
      case 401: return 'Tu sesión venció. Inicia sesión nuevamente.';
      case 403: return 'Solo las cuentas de vendedor pueden publicar ofertas.';
      case 404: return 'No se encontró el recurso solicitado.';
      case 422: return err.error?.mensaje ?? 'No se pudo completar la operación.';
      case 503: return 'La subida de imágenes no está configurada en el servidor.';
      case 0: return 'No se pudo conectar con el servidor. ¿Está encendido el backend?';
      default: return 'Ocurrió un error. Intenta de nuevo más tarde.';
    }
  }
}
