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
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
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

  test('handleSignIn navigates to login endpoint', () => {
    const gdm = initializeGoogleDriveManager('k', 'c');
    gdm.handleSignIn();
    expect(window.location.href).toContain('/api/auth/login');
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
