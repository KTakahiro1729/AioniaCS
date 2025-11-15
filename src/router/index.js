import { createRouter, createWebHistory } from 'vue-router';
import CharacterSheetPage from '@/app/pages/CharacterSheetPage.vue';
import DriveTestPage from '@/features/cloud-sync/components/DriveTestPage.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: CharacterSheetPage,
  },
  {
    path: '/drive-test',
    name: 'drive-test',
    component: DriveTestPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
