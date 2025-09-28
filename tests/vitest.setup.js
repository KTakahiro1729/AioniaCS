import './unit/setup.js';
import { vi } from 'vitest';
import { ref } from 'vue';

const auth0Mock = {
  isAuthenticated: ref(true),
  isLoading: ref(false),
  user: ref({
    name: 'Test User',
    email: 'test@example.com',
    sub: 'auth0|test-user',
  }),
  getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token'),
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
};

vi.mock(
  '@auth0/auth0-vue',
  () => ({
    useAuth0: () => auth0Mock,
  }),
  { virtual: true },
);

globalThis.__auth0Mock = auth0Mock;
