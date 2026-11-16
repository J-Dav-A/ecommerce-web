// Espejo de RegistrarCompraRequest (el comprador sale del token, no del cuerpo)
export interface RegistrarCompraRequest {
  ofertaId: string;
}

// Espejo de CompraDetalleResponse
export interface Compra {
  id: string;
  ofertaId: string;
  compradorId: string;
  montoPrecio: number;
  estado: string;
  fechaCompra: string;
}