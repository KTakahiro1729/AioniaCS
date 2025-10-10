import { initializeGoogleDriveManager, resetGoogleDriveManagerForTests } from '@/infrastructure/google-drive/googleDriveManager.js';
import { vi } from 'vitest';

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GoogleDriveManager auth integration', () => {
  beforeEach(() => {
    resetGoogleDriveManagerForTests();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetGoogleDriveManagerForTests();
  });

  test('uses access token provider when making requests', async () => {
    const provider = vi.fn().mockResolvedValue('token');
    fetch.mockResolvedValueOnce(jsonResponse({ files: [] })).mockResolvedValueOnce(jsonResponse({ id: 'cfg', name: 'aioniacs.cfg' }));

    const manager = initializeGoogleDriveManager();
    manager.setAccessTokenProvider(provider);

    await manager.loadConfig();

    expect(provider).toHaveBeenCalled();
    const headers = fetch.mock.calls[0][1].headers;
    expect(headers.get('Authorization')).toBe('Bearer token');
  });

  test('throws when no access token provider configured', async () => {
    const manager = initializeGoogleDriveManager();
    await expect(manager.loadConfig()).rejects.toThrow('No access token provider configured');
  });
});
