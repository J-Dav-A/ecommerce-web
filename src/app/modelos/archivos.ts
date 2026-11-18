// Espejo de FirmaSubidaResponse: datos para subir un archivo directo a Cloudinary
export interface FirmaSubida {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  carpeta: string;
  firma: string;
  urlDeSubida: string;
}
