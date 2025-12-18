import { createRouter, createWebHistory } from 'vue-router';
import App from '@/app/App.vue';

const DriveLoadPage = () => import('@/features/cloud-sync/pages/DriveLoadPage.vue');

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'character-sheet',
      component: App,
    },
    {
      path: '/drive/load',
      name: 'drive-load',
      component: DriveLoadPage,
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
