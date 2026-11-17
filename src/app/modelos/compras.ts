
export interface RegistrarCompraRequest {
  ofertaId: string;
  compradorId: string;
}

// Espejo de CompraDetalleResponse del backend
export interface Compra {
  id: string;
  ofertaId: string;
  compradorId: string;
  montoPrecio: number;
  estado: string;
  fechaCompra: string;
}
