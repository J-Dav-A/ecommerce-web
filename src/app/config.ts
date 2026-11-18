import { environment } from '../environments/environment';

// Dirección base de la API. Sale del archivo de entorno: no hay direcciones escritas a mano en el código.
// Los servicios la usan y los componentes nunca escriben direcciones.
export const API_URL = environment.apiUrl;
