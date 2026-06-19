import { createRouter, createWebHistory } from 'vue-router';
import Login from '../pages/Login/Login.vue';
import InternetTest from '../pages/InternetTest/InternetTest.vue';
import HeatMap from '../pages/HeatMap/HeatMap.vue';
import Settings from '../pages/Settings/Settings.vue';
import TestsResults from '../pages/TestsResults/TestsResults.vue';

const routes = [
  {
    path: '/',
    redirect: '/test'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/test',
    name: 'InternetTest',
    component: InternetTest,
    meta: { requiresAuth: true } // Bandera para proteger la ruta
  },
  {
    path: '/maps',
    name: 'HeatMap',
    component: HeatMap,
    meta: { requiresAuth: true }
  },
  {
    path: '/config',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/results',
    name: 'TestsResults',
    component: TestsResults,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/* --- GUARDIA DE SEGURIDAD (Middleware) --- */
router.beforeEach((to, from, next) => {
  const isRegistered = !!localStorage.getItem('userName');

  if (to.meta.requiresAuth && !isRegistered) {
    next('/login'); // Si no hay sesión, al login de cabeza
  } else if (to.path === '/login' && isRegistered) {
    next('/test');  // Si ya inició sesión, no tiene sentido que vea el login
  } else {
    next(); // En cualquier otra situación, pasa libre
  }
});

export default router;