import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index.js';
import { initializeGoogleDriveManager, initializeMockGoogleDriveManager } from '@/infrastructure/google-drive/index.js';
import '@/shared/styles/style.css';

const useMockDrive = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';
if (useMockDrive) {
  initializeMockGoogleDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);
} else {
  initializeGoogleDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
