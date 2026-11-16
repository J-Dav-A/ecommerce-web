import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../config';
import { Oferta, Pagina } from '../modelos/catalogo';

export interface FiltrosCatalogo {
  busqueda?: string;
  page?: number;
  size?: number;
}

// Todas las peticiones del catálogo salen de aquí; los componentes no escriben direcciones de la API
@Injectable({ providedIn: 'root' })
export class OfertasService {
  private http = inject(HttpClient);
  private url = `${API_URL}/ofertas`;

  // La paginación y la búsqueda las hace el backend: aquí solo se piden con page, size y busqueda
  listar(filtros: FiltrosCatalogo = {}) {
    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 6);
    const texto = filtros.busqueda?.trim();
    if (texto) {
      params = params.set('busqueda', texto);
    }
    return this.http.get<Pagina<Oferta>>(this.url, { params });
  }

  obtener(id: string) {
    return this.http.get<Oferta>(`${this.url}/${id}`);
  }
}