import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_URL } from '../config';
import { LoginRequest, Rol, TokenResponse, UsuarioSesion } from '../modelos/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private url = `${API_URL}/auth`;

  // Señales: cuando cambian, el menú y las pantallas se actualizan solas, sin recargar la página
  private token = signal<string | null>(localStorage.getItem('token'));
  usuario = signal<UsuarioSesion | null>(this.leerUsuario());

  isAuthenticated = computed(() => this.token() !== null);
  rol = computed<Rol | null>(() => this.usuario()?.rol ?? null);

  // Llama al backend; si sale bien guarda el token y los datos de la sesión
  login(credenciales: LoginRequest) {
    return this.http.post<TokenResponse>(`${this.url}/login`, credenciales).pipe(
      tap(respuesta => this.guardarSesion(respuesta))
    );
  }

  getToken(): string | null {
    return this.token();
  }

  tieneRol(rol: Rol): boolean {
    return this.rol() === rol;
  }

  // Borra el token y los datos: el menú vuelve a su estado inicial sin recargar
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.token.set(null);
    this.usuario.set(null);
  }

  private guardarSesion(respuesta: TokenResponse): void {
    const usuario: UsuarioSesion = {
      email: respuesta.email,
      rol: respuesta.rol,
      usuarioId: respuesta.usuarioId,
      nombre: respuesta.nombre,
    };
    localStorage.setItem('token', respuesta.token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.token.set(respuesta.token);
    this.usuario.set(usuario);
  }

  private leerUsuario(): UsuarioSesion | null {
    try {
      const guardado = localStorage.getItem('usuario');
      return guardado ? (JSON.parse(guardado) as UsuarioSesion) : null;
    } catch {
      return null;
    }
  }
}