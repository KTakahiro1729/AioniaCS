import { createApp } from 'vue';
import { createPinia } from 'pinia';
import RootApp from './RootApp.vue';
import { router } from './router/index.js';
import { initializeDriveManager } from '@/infrastructure/google-drive/index.js';
import '@/shared/styles/style.css';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

initializeDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);

const app = createApp(RootApp);
app.use(createPinia());
app.use(router);
app.mount('#app');
