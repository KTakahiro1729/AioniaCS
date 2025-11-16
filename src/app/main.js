import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createAuth0 } from '@auth0/auth0-vue';
import App from './App.vue';
import router from '@/router/index.js';
import '@/shared/styles/style.css';

const app = createApp(App);

app.use(createPinia());

const driveScopeFromEnv = import.meta.env.VITE_AUTH0_DRIVE_SCOPE;
console.log('[Debug] main.js: VITE_AUTH0_DRIVE_SCOPE の値を読み込みました:');
console.log(`[Debug] main.js: Value: "${driveScopeFromEnv}"`);
if (driveScopeFromEnv && !driveScopeFromEnv.includes('offline_access')) {
  console.error('[Debug] main.js: CRITICAL: offline_access が VITE_AUTH0_DRIVE_SCOPE に含まれていません！');
}

app.use(router);
app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_API_AUDIENCE,
      scope: import.meta.env.VITE_AUTH0_DRIVE_SCOPE,
      redirect_uri: window.location.origin,
    },
  }),
);

app.mount('#app');
