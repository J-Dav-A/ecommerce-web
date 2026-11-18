
import { Routes } from '@angular/router';

import { Inicio } from './componentes/inicio/inicio';
import { Login } from './componentes/login/login';
import { Catalogo } from './componentes/catalogo/catalogo';
import { Comprar } from './componentes/comprar/comprar';
import { Favoritos } from './componentes/favoritos/favoritos';

import {
  authGuard,
  guestGuard,
  rolGuard
} from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Inicio },

  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard]
  },

  {
    path: 'catalogo',
    component: Catalogo
  },

  {
    path: 'comprar/:id',
    component: Comprar,
    canActivate: [authGuard]
  },

  {
    path: 'favoritos',
    component: Favoritos,
    canActivate: [authGuard, rolGuard('COMPRADOR')]
  },

  {
    path: '**',
    pathMatch: 'full',
    redirectTo: '/'
  }
];
