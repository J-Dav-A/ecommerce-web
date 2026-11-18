import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, skip, switchMap, tap } from 'rxjs';
import { OfertasService } from '../../servicios/ofertas';
import { FavoritosService } from '../../servicios/favoritos';
import { AuthService } from '../../servicios/auth';
import { NotificacionesService } from '../../servicios/notificaciones';
import { Oferta, OrdenCatalogo, Pagina, Plataforma } from '../../modelos/catalogo';

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
  plataforma = signal<Plataforma | ''>('');   // filtro por plataforma ('' = todas)
  orden = signal<OrdenCatalogo | ''>('');     // criterio de orden ('' = el del backend)

  readonly plataformas: Plataforma[] = ['PC', 'PLAYSTATION', 'XBOX', 'NINTENDO'];
  readonly ordenes: { valor: OrdenCatalogo; etiqueta: string }[] = [
    { valor: 'NOMBRE', etiqueta: 'Nombre (A-Z)' },
    { valor: 'PRECIO_ASC', etiqueta: 'Precio: menor a mayor' },
    { valor: 'PRECIO_DESC', etiqueta: 'Precio: mayor a menor' },
    { valor: 'POPULARIDAD', etiqueta: 'Más populares' },
    { valor: 'CALIFICACION', etiqueta: 'Mejor calificados' },
  ];

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

  // Junta página, búsqueda y filtros en un solo objeto: cuando CUALQUIERA cambia, se vuelve a consultar.
  // Es el punto donde las señales se combinan (búsqueda + plataforma + orden + página).
  private consulta = computed(() => ({
    pagina: this.pagina(),
    busqueda: this.busqueda(),
    plataforma: this.plataforma(),
    orden: this.orden()
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
        this.ofertasService.listar({ busqueda: c.busqueda, plataforma: c.plataforma, orden: c.orden, page: c.pagina, size: this.tamano }).pipe(
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

  // Cambiar un filtro siempre vuelve a la primera página
  elegirPlataforma(valor: string): void {
    this.plataforma.set(valor as Plataforma | '');
    this.pagina.set(0);
  }

  elegirOrden(valor: string): void {
    this.orden.set(valor as OrdenCatalogo | '');
    this.pagina.set(0);
  }

  limpiarFiltros(): void {
    this.texto.set('');
    this.plataforma.set('');
    this.orden.set('');
    this.pagina.set(0);
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
