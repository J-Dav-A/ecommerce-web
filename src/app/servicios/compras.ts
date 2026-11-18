import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config';
import { Compra, RegistrarCompraRequest } from '../modelos/compras';

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private http = inject(HttpClient);
  private url = `${API_URL}/compras`;

  // POST protegido: el token lo agrega el interceptor, aquí no se escribe ningún encabezado
  crear(compra: RegistrarCompraRequest) {
    return this.http.post<Compra>(this.url, compra);
  }

  // Historial del comprador autenticado
  misCompras() {
    return this.http.get<Compra[]>(this.url);
  }

  confirmar(id: string) {
    return this.http.put<void>(`${this.url}/${id}/confirmar`, {});
  }

  reembolso(id: string, motivo: string) {
    return this.http.put<void>(`${this.url}/${id}/reembolso`, { motivo });
  }
}
