
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { OfertasService } from '../../servicios/ofertas';
import { FavoritosService } from '../../servicios/favoritos';
import { AuthService } from '../../servicios/auth';
import { NotificacionesService } from '../../servicios/notificaciones';
import { Oferta } from '../../modelos/catalogo';

@Component({
  selector: 'app-catalogo',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {

  private ofertasService = inject(OfertasService);
  private favoritosService = inject(FavoritosService);
  private avisos = inject(NotificacionesService);
  private destroyRef = inject(DestroyRef);

  protected auth = inject(AuthService);

  readonly tamanoPagina = 6;

  ofertas = signal<Oferta[]>([]);
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  cargando = signal(false);
  error = signal('');

  favoritos = signal<Set<string>>(new Set<string>());

  busqueda = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.cargar();
    this.cargarFavoritos();

    this.busqueda.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.paginaActual.set(0);
        this.cargar();
      });
  }

  // Consulta las ofertas al backend utilizando paginación y búsqueda.
  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.ofertasService
      .listar({
        busqueda: this.busqueda.value,
        page: this.paginaActual(),
        size: this.tamanoPagina
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pagina) => {
          this.ofertas.set(pagina.content);
          this.totalPaginas.set(pagina.totalPages);
          this.totalElementos.set(pagina.totalElements);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(
            'No se pudo cargar el catálogo. ¿Está encendido el backend?'
          );
          this.cargando.set(false);
        }
      });
  }

  // Carga los favoritos únicamente cuando el usuario es comprador.
  private cargarFavoritos(): void {
    if (this.auth.rol() !== 'COMPRADOR') {
      return;
    }

    this.favoritosService.listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.favoritos.set(new Set(lista.map(oferta => oferta.id)));
        },
        error: () => {
          this.avisos.error('No se pudieron cargar tus favoritos.');
        }
      });
  }

  esFavorito(oferta: Oferta): boolean {
    return this.favoritos().has(oferta.id);
  }

  // Agrega o elimina una oferta de favoritos.
  alternarFavorito(oferta: Oferta): void {
    if (this.esFavorito(oferta)) {
      this.favoritosService.quitar(oferta.id).subscribe({
        next: () => {
          this.favoritos.update(lista => {
            const nuevaLista = new Set(lista);
            nuevaLista.delete(oferta.id);
            return nuevaLista;
          });

          this.avisos.info(
            `«${oferta.titulo}» se quitó de tus favoritos`
          );
        },
        error: () => {
          this.avisos.error('No se pudo quitar el favorito.');
        }
      });
    } else {
      this.favoritosService.agregar(oferta.id).subscribe({
        next: () => {
          this.favoritos.update(lista => new Set(lista).add(oferta.id));

          this.avisos.exito(
            `«${oferta.titulo}» se agregó a tus favoritos`
          );
        },
        error: () => {
          this.avisos.error('No se pudo agregar el favorito.');
        }
      });
    }
  }

  anterior(): void {
    if (this.paginaActual() > 0) {
      this.paginaActual.update(pagina => pagina - 1);
      this.cargar();
    }
  }

  siguiente(): void {
    if (this.paginaActual() + 1 < this.totalPaginas()) {
      this.paginaActual.update(pagina => pagina + 1);
      this.cargar();
    }
  }

  limpiarBusqueda(): void {
    this.busqueda.setValue('');
  }
}

