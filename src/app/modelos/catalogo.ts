export type Plataforma = 'PC' | 'PLAYSTATION' | 'XBOX' | 'NINTENDO';

// Espejo de OfertaResponse (backend). Los nombres de los campos son idénticos a los del DTO.
export interface Oferta {
  id: string;
  vendedorId: string;
  titulo: string;
  precioValor: number;
  precioMoneda: string;
  stock: number;
  plataforma: Plataforma;
  estado: string;
  imagenes: string[];
  imagenPrincipal: string | null;
  promedioCalificacion: number | null;
  totalComentarios: number;
}

// Espejo de PageResponse (backend)
export interface Pagina<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // la página empieza en 0
}