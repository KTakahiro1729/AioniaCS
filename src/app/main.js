import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createAuth0 } from '@auth0/auth0-vue';
import RootApp from './RootApp.vue';
import { router } from './router/index.js';
import { initializeGoogleDriveManager, initializeMockGoogleDriveManager } from '@/infrastructure/google-drive/index.js';
import '@/shared/styles/style.css';

const useMockDrive = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';
if (useMockDrive) {
  initializeMockGoogleDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);
} else {
  initializeGoogleDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

const app = createApp(RootApp);
app.use(createPinia());
app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: 'openid profile email offline_access',
      redirect_uri: window.location.origin,
    },
  }),
);
app.use(router);
app.mount('#app');
