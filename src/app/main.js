import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createAuth0 } from '@auth0/auth0-vue';
import App from './App.vue';
import '@/shared/styles/style.css';

async function bootstrap() {
  let RootComponent = App;
  if (import.meta.env.DEV && window.location.pathname.startsWith('/drive-test')) {
    const module = await import('@/features/drive-test/components/DriveTestPage.vue');
    RootComponent = module.default;
  }

  const app = createApp(RootComponent);

  app.use(createPinia());
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
}

bootstrap();
