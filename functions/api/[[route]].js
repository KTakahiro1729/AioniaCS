import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { handle } from 'hono/cloudflare-pages';

const SESSION_COOKIE_NAME = 'aioniacs_session';
const STATE_COOKIE_NAME = 'aioniacs_oauth_state';
const AUTH_SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file openid email profile';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const STATE_TTL_SECONDS = 10 * 60; // 10 minutes

const encoder = new TextEncoder();

function bufferToBase64(buffer) {
  if (typeof btoa === 'function') {
    const bytes = Array.from(new Uint8Array(buffer))
      .map((b) => String.fromCharCode(b))
      .join('');
    return btoa(bytes);
  }
  return Buffer.from(buffer).toString('base64');
}

async function signPayload(secret, payload) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return bufferToBase64(signature);
}

function constantTimeEqual(a, b) {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

async function generateState(secret) {
  const random = crypto.getRandomValues(new Uint8Array(16));
  const nonce = Array.from(random)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const issuedAt = Date.now();
  const payload = `${nonce}:${issuedAt}`;
  const signature = await signPayload(secret, payload);
  return `${payload}:${signature}`;
}

async function verifyState(secret, state) {
  if (!state) {
    return false;
  }
  const segments = state.split(':');
  if (segments.length !== 3) {
    return false;
  }
  const [, issuedAtStr, signature] = segments;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > STATE_TTL_SECONDS * 1000) {
    return false;
  }
  const payload = segments.slice(0, 2).join(':');
  const expectedSignature = await signPayload(secret, payload);
  return constantTimeEqual(signature, expectedSignature);
}

function buildAuthUrl(clientId, redirectUri, state) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', AUTH_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return url.toString();
}

function getRedirectUri(request) {
  const url = new URL(request.url);
  return `${url.origin}/api/auth/callback`;
}

async function exchangeCodeForTokens(env, code, redirectUri) {
  const params = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to exchange code: ${message}`);
  }

  return response.json();
}

async function refreshAccessToken(env, refreshToken) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to refresh token: ${message}`);
  }

  return response.json();
}

async function fetchUserInfo(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to fetch user info: ${message}`);
  }

  return response.json();
}

function buildCookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

function createSessionId() {
  const random = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(random)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const app = new Hono();

app.get('/api/auth/login', async (c) => {
  const { GOOGLE_CLIENT_ID, SESSION_SECRET } = c.env;
  if (!GOOGLE_CLIENT_ID || !SESSION_SECRET) {
    return c.json({ error: 'Missing OAuth configuration.' }, 500);
  }

  const state = await generateState(SESSION_SECRET);
  const redirectUri = getRedirectUri(c.req.raw);
  const authUrl = buildAuthUrl(GOOGLE_CLIENT_ID, redirectUri, state);

  setCookie(c, STATE_COOKIE_NAME, state, buildCookieOptions(STATE_TTL_SECONDS));

  return c.redirect(authUrl, 302);
});

app.get('/api/auth/callback', async (c) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, DB } = c.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SESSION_SECRET) {
    return c.json({ error: 'Missing OAuth configuration.' }, 500);
  }

  const url = new URL(c.req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = getCookie(c, STATE_COOKIE_NAME);

  if (!code || !state || !storedState) {
    return c.json({ error: 'Invalid authorization response.' }, 400);
  }

  const stateValid = await verifyState(SESSION_SECRET, state);
  if (!stateValid || state !== storedState) {
    deleteCookie(c, STATE_COOKIE_NAME, { path: '/' });
    return c.json({ error: 'State validation failed.' }, 400);
  }

  try {
    const redirectUri = getRedirectUri(c.req.raw);
    const tokenResult = await exchangeCodeForTokens(c.env, code, redirectUri);
    const user = await fetchUserInfo(tokenResult.access_token);

    if (!tokenResult.refresh_token) {
      return c.json({ error: 'Refresh token was not returned by Google.' }, 400);
    }

    const sessionId = createSessionId();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = nowSeconds + SESSION_TTL_SECONDS;

    await DB.prepare('INSERT INTO sessions (id, user_id, email, refresh_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(sessionId, user.id || user.sub || 'unknown', user.email || '', tokenResult.refresh_token, nowSeconds, expiresAt)
      .run();

    setCookie(c, SESSION_COOKIE_NAME, sessionId, buildCookieOptions(SESSION_TTL_SECONDS));
    deleteCookie(c, STATE_COOKIE_NAME, { path: '/' });
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          // 親ウィンドウにメッセージを送る
          if (window.opener) {
            window.opener.postMessage({ type: 'AIONIACS_AUTH_SUCCESS' }, window.location.origin);
          }
          // 自分（ポップアップ）を閉じる
          window.close();
        </script>
        <p>認証が完了しました。ウィンドウを閉じてください。</p>
      </body>
      </html>
    `;
    return c.html(html);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Failed to complete authorization.' }, 500);
  }
});

app.get('/api/auth/status', async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionId) {
    return c.json({ error: 'Not authenticated.' }, 401);
  }

  try {
    const session = await c.env.DB.prepare('SELECT * FROM sessions WHERE id = ?').bind(sessionId).first();
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!session || session.expires_at <= nowSeconds) {
      await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
      deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
      return c.json({ error: 'Session expired.' }, 401);
    }

    const refreshed = await refreshAccessToken(c.env, session.refresh_token);

    if (refreshed.refresh_token) {
      await c.env.DB.prepare('UPDATE sessions SET refresh_token = ?, expires_at = ? WHERE id = ?')
        .bind(refreshed.refresh_token, nowSeconds + SESSION_TTL_SECONDS, sessionId)
        .run();
    } else {
      await c.env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?')
        .bind(nowSeconds + SESSION_TTL_SECONDS, sessionId)
        .run();
    }

    return c.json({ access_token: refreshed.access_token, expires_in: refreshed.expires_in });
  } catch (error) {
    console.error('Auth status error:', error);
    return c.json({ error: 'Failed to refresh access token.' }, 500);
  }
});

app.post('/api/auth/logout', async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
  return c.json({ success: true });
});

export { app };

export const onRequest = handle(app);
