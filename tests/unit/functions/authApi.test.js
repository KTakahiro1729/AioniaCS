import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../../../functions/api/[[route]].js';

function createMockDb() {
  const sessions = new Map();
  return {
    sessions,
    prepare(query) {
      const normalized = query.trim().toLowerCase();
      return {
        bind: (...params) => ({
          async first() {
            if (normalized.startsWith('select')) {
              const [id] = params;
              return sessions.get(id) || null;
            }
            return null;
          },
          async run() {
            if (normalized.startsWith('insert')) {
              const [id, userId, email, refreshToken, createdAt, expiresAt] = params;
              sessions.set(id, {
                id,
                user_id: userId,
                email,
                refresh_token: refreshToken,
                created_at: createdAt,
                expires_at: expiresAt,
              });
              return { success: true };
            }
            if (normalized.startsWith('delete')) {
              const [id] = params;
              sessions.delete(id);
              return { success: true };
            }
            if (normalized.startsWith('update sessions set refresh_token')) {
              const [refreshToken, expiresAt, id] = params;
              const existing = sessions.get(id);
              if (existing) {
                existing.refresh_token = refreshToken;
                existing.expires_at = expiresAt;
                sessions.set(id, existing);
              }
              return { success: true };
            }
            if (normalized.startsWith('update sessions set expires_at')) {
              const [expiresAt, id] = params;
              const existing = sessions.get(id);
              if (existing) {
                existing.expires_at = expiresAt;
                sessions.set(id, existing);
              }
              return { success: true };
            }
            return { success: false };
          },
        }),
      };
    },
  };
}

function readCookie(headers, name) {
  const raw = headers.getSetCookie ? headers.getSetCookie() : [headers.get('set-cookie')].filter(Boolean);
  const cookieHeader = raw?.find((c) => c && c.startsWith(`${name}=`));
  if (!cookieHeader) return null;
  const [pair] = cookieHeader.split(';');
  return pair.split('=')[1];
}

describe('Cloudflare auth functions', () => {
  let env;
  let db;

  beforeEach(() => {
    db = createMockDb();
    env = {
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
      SESSION_SECRET: 'secret',
      DB: db,
    };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('login endpoint redirects to Google with state cookie', async () => {
    const res = await app.request('https://example.com/api/auth/login', {}, env);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('accounts.google.com');
    const state = readCookie(res.headers, 'aioniacs_oauth_state');
    expect(state).toBeTruthy();
  });

  test('callback exchanges code, stores session, and sets cookie', async () => {
    const loginRes = await app.request('https://example.com/api/auth/login', {}, env);
    const state = readCookie(loginRes.headers, 'aioniacs_oauth_state');

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user-1', email: 'user@example.com' }) });

    const res = await app.request(
      `https://example.com/api/auth/callback?code=abc&state=${state}`,
      {
        headers: { Cookie: `aioniacs_oauth_state=${state}` },
      },
      env,
    );

    expect(res.status).toBe(200);

    const body = await res.text();
    expect(body).toContain('window.opener.postMessage');

    const sessionId = readCookie(res.headers, 'aioniacs_session');
    expect(sessionId).toBeTruthy();
    const stored = db.sessions.get(sessionId);
    expect(stored.refresh_token).toBe('refresh');
    expect(stored.email).toBe('user@example.com');
  });

  test('status endpoint refreshes access token using stored session', async () => {
    const sessionId = 'session-1';
    const now = Math.floor(Date.now() / 1000);
    db.sessions.set(sessionId, {
      id: sessionId,
      user_id: 'user',
      email: 'user@example.com',
      refresh_token: 'refresh-old',
      created_at: now,
      expires_at: now + 1000,
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'new-access', refresh_token: 'refresh-new', expires_in: 1200 }),
    });

    const res = await app.request(
      'https://example.com/api/auth/status',
      {
        headers: { Cookie: `aioniacs_session=${sessionId}` },
      },
      env,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBe('new-access');
    expect(db.sessions.get(sessionId).refresh_token).toBe('refresh-new');
  });

  test('logout endpoint clears session', async () => {
    const sessionId = 'session-logout';
    db.sessions.set(sessionId, {
      id: sessionId,
      user_id: 'user',
      email: 'user@example.com',
      refresh_token: 'refresh-old',
      created_at: 0,
      expires_at: 100,
    });

    const res = await app.request(
      'https://example.com/api/auth/logout',
      {
        method: 'POST',
        headers: { Cookie: `aioniacs_session=${sessionId}` },
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(db.sessions.has(sessionId)).toBe(false);
    const cleared = readCookie(res.headers, 'aioniacs_session');
    expect(cleared).toBe('');
  });
});
