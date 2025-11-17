import { createRouter, createWebHistory } from 'vue-router';
import App from '@/app/App.vue';

const AuthDebugPage = () => import('@/features/debug/pages/AuthDebugPage.vue');

const routes = [
  {
    path: '/',
    component: App,
  },
  {
    path: '/debug',
    component: AuthDebugPage,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
