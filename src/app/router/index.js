import { createRouter, createWebHistory } from 'vue-router';
import CharacterSheetPage from '@/features/character-sheet/pages/CharacterSheetPage.vue';
import GmTablePage from '@/features/gm-table/pages/GmTablePage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'character-sheet',
      component: CharacterSheetPage,
    },
    {
      path: '/gm-table',
      name: 'gm-table',
      component: GmTablePage,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
