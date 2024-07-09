import { lazy } from 'solid-js';

import Home from './pages/home';

import type { RouteDefinition } from 'solid-app-router';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '**',
    component: lazy(() => import('./errors/404')),
  },
];
