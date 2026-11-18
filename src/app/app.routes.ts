import { Routes } from '@angular/router';
import { Inicio } from './componentes/inicio/inicio';
import { Login } from './componentes/login/login';
import { Catalogo } from './componentes/catalogo/catalogo';
import { Comprar } from './componentes/comprar/comprar';
import { Favoritos } from './componentes/favoritos/favoritos';
import { Vendedor } from './componentes/vendedor/vendedor';
import { MisCompras } from './componentes/mis-compras/mis-compras';
import { authGuard, guestGuard, rolGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'catalogo', component: Catalogo },
  { path: 'comprar/:id', component: Comprar, canActivate: [authGuard] },
  { path: 'favoritos', component: Favoritos, canActivate: [authGuard, rolGuard('COMPRADOR')] },
  { path: 'mis-compras', component: MisCompras, canActivate: [authGuard, rolGuard('COMPRADOR')] },
  { path: 'vendedor', component: Vendedor, canActivate: [authGuard, rolGuard('VENDEDOR')] },
  { path: '**', pathMatch: 'full', redirectTo: '/' },
];
