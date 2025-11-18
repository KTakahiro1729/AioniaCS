const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REFRESH_COOKIE = 'gdrive_refresh_token';
const STATE_COOKIE = 'gdrive_oauth_state';
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

function buildHtmlResponse(payload) {
  const messageData = JSON.stringify({
    type: 'google-drive-auth',
    accessToken: payload.accessToken || null,
    expiresIn: payload.expiresIn || null,
    error: payload.error || null,
  });

  const displayText = payload.error
    ? '認証に失敗しました。ウィンドウを閉じて、もう一度お試しください。'
    : '認証が完了しました。このウィンドウは自動で閉じます。';

  return `<!doctype html><html><body><p>${displayText}</p><script>
    (function() {
      const data = ${messageData};
      const targetOrigin = window.location.origin;
      try {
        window.opener && window.opener.postMessage(data, targetOrigin);
      } catch (err) {
        console.error('Failed to notify opener', err);
      }
      window.close();
      setTimeout(() => window.close(), 500);
    })();
  </script></body></html>`;
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get('state');

  const cookies = parseCookies(request.headers.get('Cookie'));
  if (!state || !cookies[STATE_COOKIE] || cookies[STATE_COOKIE] !== state) {
    const html = buildHtmlResponse({ error: '不正な認証リクエストです。' });
    return new Response(html, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': clearCookie(STATE_COOKIE) },
    });
  }

  if (error) {
    const html = buildHtmlResponse({ error });
    return new Response(html, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': clearCookie(STATE_COOKIE) },
    });
  }

  if (!code) {
    const html = buildHtmlResponse({ error: '認可コードを取得できませんでした。' });
    return new Response(html, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': clearCookie(STATE_COOKIE) },
    });
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const html = buildHtmlResponse({ error: 'サーバーの認証設定が不足しています。' });
    return new Response(html, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': clearCookie(STATE_COOKIE) },
    });
  }

  const redirectUri = new URL('/api/auth/callback', request.url).toString();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenResponse.ok) {
    const html = buildHtmlResponse({ error: 'アクセストークンの取得に失敗しました。' });
    return new Response(html, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': clearCookie(STATE_COOKIE) },
    });
  }

  const tokenPayload = await tokenResponse.json();
  const cookiesToSet = [clearCookie(STATE_COOKIE)];
  if (tokenPayload.refresh_token) {
    cookiesToSet.push(buildCookie(REFRESH_COOKIE, tokenPayload.refresh_token, ONE_YEAR_SECONDS));
  }

  const html = buildHtmlResponse({
    accessToken: tokenPayload.access_token,
    expiresIn: tokenPayload.expires_in,
  });

  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
  if (cookiesToSet.length > 0) {
    headers.append('Set-Cookie', cookiesToSet.shift());
    cookiesToSet.forEach((cookie) => headers.append('Set-Cookie', cookie));
  }

  return new Response(html, {
    status: 200,
    headers,
  });
}
