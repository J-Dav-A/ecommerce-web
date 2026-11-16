import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { OfertasService } from '../../servicios/ofertas';
import { Oferta } from '../../modelos/catalogo';

@Component({
  selector: 'app-catalogo',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {
  private ofertasService = inject(OfertasService);
  private destroyRef = inject(DestroyRef);

  readonly tamanoPagina = 6;

  // Estado de la pantalla en señales: cuando cambian, la vista se actualiza sola
  ofertas = signal<Oferta[]>([]);
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  cargando = signal(false);
  error = signal('');

  // Espera 400 ms después de que el usuario deja de escribir
  busqueda = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.cargar();

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

  // La búsqueda y la paginación las hace el backend
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

  anterior(): void {
    if (this.paginaActual() > 0) {
      this.paginaActual.update(p => p - 1);
      this.cargar();
    }
  }

  siguiente(): void {
    if (this.paginaActual() + 1 < this.totalPaginas()) {
      this.paginaActual.update(p => p + 1);
      this.cargar();
    }
  }

  limpiarBusqueda(): void {
    this.busqueda.setValue('');
  }
}
