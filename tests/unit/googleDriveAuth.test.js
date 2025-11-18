import { initializeGoogleDriveManager, resetGoogleDriveManagerForTests } from '@/infrastructure/google-drive/googleDriveManager.js';
import { vi } from 'vitest';

describe('GoogleDriveManager auth', () => {
  beforeEach(() => {
    resetGoogleDriveManagerForTests();
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'refreshed', expiresIn: 3600 }),
    });
    global.gapi = {
      load: vi.fn((_, cb) => cb()),
      client: {
        init: vi.fn(() => Promise.resolve()),
        setToken: vi.fn(),
      },
    };
  });

  afterEach(() => {
    resetGoogleDriveManagerForTests();
    vi.useRealTimers();
  });

  test('setAccessToken applies token and schedules refresh', async () => {
    const gdm = initializeGoogleDriveManager('k');
    await gdm.setAccessToken('token', 3600);

    expect(gapi.client.setToken).toHaveBeenCalledWith({ access_token: 'token' });

    await vi.advanceTimersByTimeAsync((3600 - 300) * 1000 + 1000);

    expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', { credentials: 'include' });
  });

  test('handleSignOut clears tokens and requests cookie removal', async () => {
    const gdm = initializeGoogleDriveManager('k');
    gapi.client.setToken.mockClear();

    await gdm.handleSignOut(() => {});

    expect(gapi.client.setToken).toHaveBeenCalledWith(null);
    expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', { method: 'DELETE', credentials: 'include' });
  });
});
