import { createRouter, createWebHistory } from 'vue-router';
import App from '@/app/App.vue';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'character-sheet',
      component: App,
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
