export async function fetchDriveAccessTokenFromAuth0(getAccessTokenSilently) {
  const tokenExchangeUrl = import.meta.env.VITE_AUTH0_DRIVE_TOKEN_URL;
  if (!tokenExchangeUrl || typeof getAccessTokenSilently !== 'function') {
    return null;
  }

  const auth0Token = await getAccessTokenSilently({
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: 'openid profile email offline_access',
    },
  });

  const response = await fetch(tokenExchangeUrl, {
    headers: {
      Authorization: `Bearer ${auth0Token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Drive access token via Auth0.');
  }

  const payload = await response.json();
  return payload?.access_token || payload?.googleAccessToken || null;
}
