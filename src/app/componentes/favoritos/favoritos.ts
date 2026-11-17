
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { FavoritosService } from '../../servicios/favoritos';
import { NotificacionesService } from '../../servicios/notificaciones';
import { Oferta } from '../../modelos/catalogo';

@Component({
  selector: 'app-favoritos',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.css'
})
export class Favoritos implements OnInit {

  private favoritosService = inject(FavoritosService);
  private avisos = inject(NotificacionesService);
  private destroyRef = inject(DestroyRef);

  favoritos = signal<Oferta[]>([]);
  cargando = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.favoritosService.listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.favoritos.set(lista);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar tus favoritos.');
          this.cargando.set(false);
        }
      });
  }

  quitar(oferta: Oferta): void {
    this.favoritosService.quitar(oferta.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.favoritos.update(
            lista => lista.filter(f => f.id !== oferta.id)
          );
          this.avisos.info(`«${oferta.titulo}» se quitó de tus favoritos`);
        },
        error: () => this.avisos.error(
          'No se pudo quitar el favorito. Intenta de nuevo.'
        )
      });
  }
}
