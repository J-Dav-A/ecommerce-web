
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config';
import { Oferta } from '../modelos/catalogo';

// Los favoritos pertenecen al comprador autenticado.
// El backend identifica al usuario mediante el token JWT.
@Injectable({
  providedIn: 'root'
})
export class FavoritosService {

  private http = inject(HttpClient);
  private url = `${API_URL}/favoritos`;

  // Obtener la lista de favoritos del comprador
  listar() {
    return this.http.get<Oferta[]>(this.url);
  }

  // Agregar una oferta a favoritos
  agregar(ofertaId: string) {
    return this.http.post<Oferta>(`${this.url}/${ofertaId}`, {});
  }

  // Quitar una oferta de favoritos
  quitar(ofertaId: string) {
    return this.http.delete<void>(`${this.url}/${ofertaId}`);
  }
}
