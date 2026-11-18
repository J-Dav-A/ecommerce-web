# Marketplace de Videojuegos — Frontend

Proyecto de la asignatura **Programación Avanzada**, Universidad del Quindío (Entrega 3). Aplicación web en **Angular** que consume la API REST del backend del marketplace.

- Backend (Spring Boot): https://github.com/J-Dav-A/ecommerce
- Frontend (este repositorio): https://github.com/J-Dav-A/ecommerce-web

## Integrantes

- Juan David Arango Valencia
- Erwin Johannes Willem Harder Garzón

## Nicho

Marketplace de videojuegos digitales: los **vendedores** publican ofertas de juegos (plataforma, precio, stock) y los **compradores** las adquieren y reciben una clave digital de activación. El frontend permite ver el catálogo, iniciar sesión, comprar y guardar juegos favoritos.

## Tecnologías

- Angular 22 (componentes standalone, señales, `@if` / `@for`, formularios reactivos)
- Bootstrap 5.3 y Font Awesome (instalados con npm y cargados desde `angular.json`)
- RxJS (`toSignal`, `toObservable`, `debounceTime`, `switchMap`)
- JWT guardado en `localStorage`

## Cómo ejecutarlo

Se necesitan **Node 22.22.3 o superior**, el CLI de Angular (`npm install -g @angular/cli`) y **Java 21** para el backend.

### 1. Backend

```
git clone https://github.com/J-Dav-A/ecommerce.git
cd ecommerce
git checkout feature/juan
.\gradlew.bat bootRun --args='--spring.profiles.active=demo'
```

Queda en http://localhost:8080. El perfil `demo` agrega 12 ofertas extra (14 en total) para ver la paginación; sin él solo hay 2 ofertas. Los datos se pierden al apagar el backend (base H2 en memoria). Hay un perfil `mariadb` para persistirlos; ver el README del backend.

### 2. Frontend

```
git clone https://github.com/J-Dav-A/ecommerce-web.git
cd ecommerce-web
npm install
ng serve
```

Abrir http://localhost:4200 (usar `localhost`, no `127.0.0.1`: el backend solo permite ese origen por CORS).

## Usuarios de prueba

La contraseña de ambos es `clave123`.

| Correo | Rol | Qué puede hacer |
|---|---|---|
| `juan@gmail.com` | COMPRADOR | Comprar y usar favoritos |
| `admin@ecommerce.com` | VENDEDOR | Ver el catálogo (el backend no le deja comprar ni tener favoritos) |

## Pantallas

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/` | Inicio | Público |
| `/login` | Iniciar sesión (formulario reactivo con validaciones) | Solo sin sesión (`guestGuard`) |
| `/catalogo` | Catálogo con tarjetas, paginación "Página X de Y" y búsqueda por título | Público |
| `/comprar/:id` | Confirmar compra de una oferta (POST protegido) | Con sesión (`authGuard`) |
| `/favoritos` | Mis favoritos | Con sesión y rol COMPRADOR (`authGuard` + `rolGuard`) |

Cualquier otra dirección redirige a `/`.

## Cómo está organizado

```
src/app/
  config.ts          Dirección base de la API (un solo lugar)
  modelos/           Interfaces que copian los DTO del backend (auth, catalogo, compras)
  servicios/         Un servicio por grupo de endpoints: auth, ofertas, compras, favoritos, notificaciones
  interceptores/     auth-interceptor: agrega "Authorization: Bearer" y maneja el 401
  guards/            authGuard, guestGuard y rolGuard
  componentes/       header, footer, inicio, login, catalogo, comprar, favoritos, notificaciones
```

## Qué cumple la rúbrica

- **Servicios por grupo de endpoints** y sin datos escritos a mano: todo el catálogo, las compras y los favoritos salen del backend.
- **Login con JWT:** formulario reactivo con validaciones, token en `localStorage`, menú que cambia con la sesión, cierre de sesión y mensaje con credenciales incorrectas.
- **Interceptor HTTP:** agrega el token a cada petición y, ante un `401` con sesión iniciada, cierra la sesión, avisa y lleva al login.
- **Guards:** `authGuard`, `guestGuard` y `rolGuard` aplicados a rutas reales.
- **Catálogo:** paginación y búsqueda hechas por el backend (`page`, `size`, `busqueda`), mensaje cuando no hay resultados.
- **Búsqueda reactiva:** `debounceTime(400)` y `switchMap`; escribir "mario" tecla por tecla genera una sola petición.
- **Operación de negocio:** compra con formulario reactivo, botón deshabilitado mientras se envía y códigos HTTP (400, 401, 403, 404, 422) traducidos a mensajes.
- **Notificaciones:** servicio y componente con avisos que desaparecen solos (éxito, error, sesión vencida).
- **Funcionalidad propia:** favoritos (corazón en el catálogo y página `/favoritos`).
- **Bootstrap:** navbar con menú hamburguesa, cuadrícula de tarjetas responsive y clases de formulario.

## Flujo de trabajo con Git

Ramas `main`, `feature/juan` y `feature/erwin`. Cada integrante trabaja en su rama y los cambios llegan a `main` por Pull Request.