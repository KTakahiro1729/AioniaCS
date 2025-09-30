import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/css/style.css';
import App from './App.vue';
import { initializeGoogleDriveManager } from './services/googleDriveManager.js';
import { initializeMockGoogleDriveManager } from './services/mockGoogleDriveManager.js';

const useMockDrive = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';
if (useMockDrive) {
  initializeMockGoogleDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);
} else {
  initializeGoogleDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
