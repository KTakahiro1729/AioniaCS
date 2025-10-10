import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createAuth0 } from '@auth0/auth0-vue';
import { initializeGoogleDriveManager, initializeMockGoogleDriveManager } from '@/infrastructure/google-drive/index.js';
import '@/shared/styles/style.css';

const useMockDrive = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';
if (useMockDrive) {
  initializeMockGoogleDriveManager();
} else {
  initializeGoogleDriveManager();
}

const app = createApp(App);
app.use(createPinia());
app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_API_AUDIENCE,
      redirect_uri: window.location.origin,
      scope: 'https://www.googleapis.com/auth/drive.file',
    },
    cacheLocation: 'localstorage',
  }),
);
app.mount('#app');
