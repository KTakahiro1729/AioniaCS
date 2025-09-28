const defaultAuth0Mock = {
  isAuthenticated: { value: false },
  isLoading: { value: false },
  user: { value: null },
  getAccessTokenSilently: async () => 'mock-token',
  loginWithRedirect: () => {},
  logout: () => {},
};

export const useAuth0 = () => {
  return globalThis.__auth0Mock ?? defaultAuth0Mock;
};

export default {
  useAuth0,
};
