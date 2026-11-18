import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, skip, switchMap, tap } from 'rxjs';
import { OfertasService } from '../../servicios/ofertas';
import { FavoritosService } from '../../servicios/favoritos';
import { AuthService } from '../../servicios/auth';
import { NotificacionesService } from '../../servicios/notificaciones';
import { Oferta, Pagina } from '../../modelos/catalogo';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo {
  private ofertasService = inject(OfertasService);
  private favoritosService = inject(FavoritosService);
  private avisos = inject(NotificacionesService);
  protected auth = inject(AuthService);

  // ---- Estado de la pantalla (señales): en qué página voy y qué estoy buscando ----
  readonly tamano = 6;
  pagina = signal(0);   // el backend cuenta las páginas desde 0
  texto = signal('');   // lo que la persona escribe, tecla por tecla

  cargando = signal(true);
  error = signal('');

  // Búsqueda reactiva: el texto "rebota" 400 ms y solo cambia cuando la persona deja de teclear.
  // Una búsqueda nueva siempre vuelve a la primera página.
  busqueda = toSignal(
    toObservable(this.texto).pipe(
      skip(1), // ignora el valor inicial (vacío): solo reaccionamos cuando la persona escribe
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => this.pagina.set(0))
    ),
    { initialValue: '' }
  );

  // Junta página y búsqueda en un solo objeto: cuando cualquiera cambia, se vuelve a consultar
  private consulta = computed(() => ({
    pagina: this.pagina(),
    busqueda: this.busqueda()
  }));

  // switchMap cancela la petición anterior si llega una nueva (nunca se muestra una respuesta vieja).
  // El catchError va DENTRO del switchMap: si una petición falla, el flujo sigue vivo y los botones siguen funcionando.
  respuesta = toSignal(
    toObservable(this.consulta).pipe(
      tap(() => {
        this.cargando.set(true);
        this.error.set('');
      }),
      switchMap(c =>
        this.ofertasService.listar({ busqueda: c.busqueda, page: c.pagina, size: this.tamano }).pipe(
          tap(() => this.cargando.set(false)),
          catchError(() => {
            this.cargando.set(false);
            this.error.set('No se pudo cargar el catálogo. ¿Está encendido el backend?');
            this.avisos.error('No pudimos cargar el catálogo.');
            return of(null);
          })
        )
      )
    ),
    { initialValue: null as Pagina<Oferta> | null }
  );

  // Lo que necesita el HTML, calculado a partir de la respuesta del backend
  ofertas = computed(() => this.respuesta()?.content ?? []);
  totalPaginas = computed(() => this.respuesta()?.totalPages ?? 0);
  total = computed(() => this.respuesta()?.totalElements ?? 0);
  esPrimera = computed(() => this.pagina() === 0);
  esUltima = computed(() => this.pagina() >= this.totalPaginas() - 1);

  // ---- Favoritos (solo compradores) ----
  favoritos = signal<Set<string>>(new Set<string>()); // ids de las ofertas favoritas

  constructor() {
    if (this.auth.rol() === 'COMPRADOR') {
      this.favoritosService.listar().subscribe({
        next: (lista) => this.favoritos.set(new Set(lista.map(o => o.id))),
        error: () => this.avisos.error('No se pudieron cargar tus favoritos.')
      });
    }
  }

  escribir(valor: string): void {
    this.texto.set(valor);
  }

  anterior(): void {
    this.pagina.update(p => p - 1);
  }

  siguiente(): void {
    this.pagina.update(p => p + 1);
  }

  esFavorito(oferta: Oferta): boolean {
    return this.favoritos().has(oferta.id);
  }

  // Agrega o quita la oferta de favoritos según el estado actual
  alternarFavorito(oferta: Oferta): void {
    if (this.esFavorito(oferta)) {
      this.favoritosService.quitar(oferta.id).subscribe({
        next: () => {
          this.favoritos.update(s => { const n = new Set(s); n.delete(oferta.id); return n; });
          this.avisos.info(`«${oferta.titulo}» se quitó de tus favoritos`);
        },
        error: () => this.avisos.error('No se pudo quitar el favorito.')
      });
    } else {
      this.favoritosService.agregar(oferta.id).subscribe({
        next: () => {
          this.favoritos.update(s => new Set(s).add(oferta.id));
          this.avisos.exito(`«${oferta.titulo}» se agregó a tus favoritos`);
        },
        error: () => this.avisos.error('No se pudo agregar el favorito.')
      });
    }
  }
}