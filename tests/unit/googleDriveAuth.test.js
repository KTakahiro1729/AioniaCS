import { initializeGoogleDriveManager, resetGoogleDriveManagerForTests } from '@/infrastructure/google-drive/googleDriveManager.js';
import { vi } from 'vitest';

describe('GoogleDriveManager auth', () => {
  beforeEach(() => {
    resetGoogleDriveManagerForTests();
    global.fetch = vi.fn();
    global.gapi = {
      load: vi.fn((_, cb) => cb()),
      client: {
        init: vi.fn().mockResolvedValue(),
        getToken: vi.fn(() => null),
        setToken: vi.fn(),
      },
    };
    vi.spyOn(window, 'open').mockImplementation(() => ({ closed: false }));
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost', origin: 'http://localhost' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetGoogleDriveManagerForTests();
  });

  test('ensureAccessToken requests token from backend and applies it to gapi', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'server-access', expires_in: 3600 }),
    });

    const gdm = initializeGoogleDriveManager('k', 'c');
    await gdm.onGapiLoad();
    const token = await gdm.ensureAccessToken();

    expect(token).toBe('server-access');
    expect(fetch).toHaveBeenCalledWith('/api/auth/status', { credentials: 'include' });
    expect(gapi.client.setToken).toHaveBeenCalledWith({ access_token: 'server-access', expires_in: 3600 });
  });

  test('handleSignIn opens login endpoint in a popup', () => {
    const gdm = initializeGoogleDriveManager('k', 'c');
    gdm.handleSignIn();

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      'google_auth_popup',
      expect.stringContaining('width=500'),
    );
  });

  test('handleSignOut clears token and calls logout API', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    gapi.client.setToken = vi.fn();

    const gdm = initializeGoogleDriveManager('k', 'c');
    await gdm.handleSignOut();

    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST', credentials: 'include' });
    expect(gapi.client.setToken).toHaveBeenCalledWith('');
  });
});
