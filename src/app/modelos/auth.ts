// Espejo de LoginDTO (backend)
export interface LoginRequest {
  email: string;
  password: string;
}

// Espejo de TokenDTO (backend)
export interface TokenResponse {
  token: string;
  tipo: string;
  email: string;
  rol: Rol;
  usuarioId: string;
  nombre: string;
}

export type Rol = 'VENDEDOR' | 'COMPRADOR';

// Lo que guardamos de la sesión (el token va aparte)
export interface UsuarioSesion {
  email: string;
  rol: Rol;
  usuarioId: string;
  nombre: string;
}