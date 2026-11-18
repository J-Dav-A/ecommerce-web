import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs';
import { API_URL } from '../config';
import { FirmaSubida } from '../modelos/archivos';

// Subida de imágenes: 1) pide una firma a NUESTRO backend, 2) sube el archivo directo a Cloudinary.
// El secreto de Cloudinary nunca llega al navegador.
@Injectable({ providedIn: 'root' })
export class ArchivosService {
  private http = inject(HttpClient);

  firma(carpeta: 'ofertas' | 'perfiles') {
    return this.http.get<FirmaSubida>(`${API_URL}/archivos/firma`, { params: { carpeta } });
  }

  // Devuelve la URL pública de la imagen subida
  subirImagen(archivo: File, carpeta: 'ofertas' | 'perfiles' = 'ofertas') {
    return this.firma(carpeta).pipe(
      switchMap(f => {
        const datos = new FormData();
        datos.append('file', archivo);
        datos.append('api_key', f.apiKey);
        datos.append('timestamp', String(f.timestamp));
        datos.append('folder', f.carpeta);
        datos.append('signature', f.firma);
        return this.http.post<{ secure_url: string }>(f.urlDeSubida, datos);
      }),
      map(r => r.secure_url)
    );
  }
}
