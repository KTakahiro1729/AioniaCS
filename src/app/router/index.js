import { createRouter, createWebHistory } from 'vue-router';

const CharacterSheetPage = () => import('@/features/character-sheet/pages/CharacterSheetPage.vue');
const GmTablePage = () => import('@/features/gm-table/pages/GmTablePage.vue');

export const router = createRouter({
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
  ],
});
