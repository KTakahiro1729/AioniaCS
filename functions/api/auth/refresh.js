const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REFRESH_COOKIE = 'gdrive_refresh_token';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function parseCookies(header) {
  const pairs = (header || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
  return Object.fromEntries(
    pairs.map((part) => {
      const [key, ...rest] = part.split('=');
      return [key, rest.join('=')];
    }),
  );
}

function buildCookie(name, value, maxAgeSeconds) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function refreshToken({ refreshToken, clientId, clientSecret, redirectUri }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  if (redirectUri) {
    body.set('redirect_uri', redirectUri);
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json();
  return { ok: response.ok, payload };
}

export async function onRequest({ request, env }) {
  if (request.method === 'DELETE') {
    return new Response(null, {
      status: 204,
      headers: { 'Set-Cookie': clearCookie(REFRESH_COOKIE) },
    });
  }

  const cookies = parseCookies(request.headers.get('Cookie'));
  const refreshTokenValue = cookies[REFRESH_COOKIE];
  if (!refreshTokenValue) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: 'Server configuration missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { ok, payload } = await refreshToken({ refreshToken: refreshTokenValue, clientId, clientSecret });
  if (!ok || !payload?.access_token) {
    return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearCookie(REFRESH_COOKIE) },
    });
  }

  const cookiesToSet = [];
  if (payload.refresh_token) {
    cookiesToSet.push(buildCookie(REFRESH_COOKIE, payload.refresh_token, ONE_YEAR_SECONDS));
  }

  const headers = new Headers({ 'Content-Type': 'application/json' });
  cookiesToSet.forEach((cookie) => headers.append('Set-Cookie', cookie));

  const responseBody = {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in || 3600,
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers,
  });
}
