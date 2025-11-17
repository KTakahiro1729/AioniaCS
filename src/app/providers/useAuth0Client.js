import { computed } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';

export function useAuth0Client() {
  const auth0 = useAuth0();
  const isAuthenticated = computed(() => auth0.isAuthenticated.value);
  const user = computed(() => auth0.user.value);
  const isLoading = computed(() => auth0.isLoading.value);

  async function ensureLogin(options = {}) {
    if (isAuthenticated.value) {
      return true;
    }
    await auth0.loginWithRedirect(options);
    return true;
  }

  async function logout(options = {}) {
    await auth0.logout({
      logoutParams: { returnTo: window.location.origin, ...options.logoutParams },
    });
  }

  async function getAccessToken(options = {}) {
    return auth0.getAccessTokenSilently(options);
  }

  return {
    isAuthenticated,
    isLoading,
    user,
    ensureLogin,
    logout,
    getAccessToken,
    loginWithRedirect: auth0.loginWithRedirect,
  };
}
