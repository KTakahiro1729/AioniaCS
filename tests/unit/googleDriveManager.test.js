import {
  GoogleDriveManager,
  initializeGoogleDriveManager,
  getGoogleDriveManagerInstance,
  resetGoogleDriveManagerForTests,
} from '@/infrastructure/google-drive/googleDriveManager.js';
import { vi } from 'vitest';

function createConfigResponse(overrides = {}) {
  return {
    folder_path: '慈悲なきアイオニア',
    folder_id: null,
    folder_name: null,
    ...overrides,
  };
}

describe('GoogleDriveManager configuration and folder handling', () => {
  let gdm;

  beforeEach(() => {
    resetGoogleDriveManagerForTests();
    global.fetch = vi.fn((url, options = {}) => {
      if (url === '/api/user/config' && (!options.method || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: async () => createConfigResponse() });
      }
      if (url === '/api/user/config' && options.method === 'PUT') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.gapi = {
      client: {
        drive: {
          files: {
            list: vi.fn(),
            create: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
          },
        },
        request: vi.fn(),
        getToken: vi.fn(() => ({ access_token: 'cached-token' })),
        setToken: vi.fn(),
      },
    };
    gdm = initializeGoogleDriveManager('key', 'client');
    gdm.currentTokenInfo = { accessToken: 'cached-token', expiresAt: Date.now() + 100000 };
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetGoogleDriveManagerForTests();
    delete global.google;
  });

  test('loadConfig pulls folder data from D1 and caches id', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createConfigResponse({ folder_path: 'My Folder', folder_id: 'folder-123', folder_name: 'My Folder' }),
    });

    const config = await gdm.loadConfig();

    expect(fetch).toHaveBeenCalledWith('/api/user/config', { credentials: 'include' });
    expect(config.folderId).toBe('folder-123');
    expect(config.characterFolderPath).toBe('My Folder');
    expect(gdm.aioniaFolderId).toBe('folder-123');
    expect(gdm.cachedFolderPath).toBe('My Folder');
  });

  test('setCharacterFolderPath resets cached folder info and persists to D1', async () => {
    await gdm.loadConfig();
    gdm.aioniaFolderId = 'old';
    gdm.cachedFolderPath = 'Old Path';

    await gdm.setCharacterFolderPath('New Path');

    const putCall = fetch.mock.calls.find(([url, opts]) => url === '/api/user/config' && opts?.method === 'PUT');
    expect(putCall).toBeTruthy();
    const body = JSON.parse(putCall[1].body);
    expect(body.folder_path).toBe('New Path');
    expect(body.folder_id).toBeNull();
    expect(gdm.aioniaFolderId).toBeNull();
    expect(gdm.cachedFolderPath).toBeNull();
  });

  test('findOrCreateConfiguredCharacterFolder returns stored id without Drive traversal', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createConfigResponse({ folder_id: 'd1-folder', folder_path: 'Stored' }),
    });

    const folderId = await gdm.findOrCreateConfiguredCharacterFolder();

    expect(folderId).toBe('d1-folder');
    expect(gapi.client.drive.files.list).not.toHaveBeenCalled();
    expect(gapi.client.drive.files.create).not.toHaveBeenCalled();
  });

  test('findOrCreateConfiguredCharacterFolder builds nested folders when missing id', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createConfigResponse({ folder_path: 'Parent/Child' }),
    });
    gapi.client.drive.files.list.mockImplementation(({ q }) => {
      if (q.includes("name='Parent'")) {
        return Promise.resolve({ result: { files: [] } });
      }
      if (q.includes("name='Child'")) {
        return Promise.resolve({ result: { files: [] } });
      }
      throw new Error(`Unexpected query: ${q}`);
    });
    gapi.client.drive.files.create
      .mockResolvedValueOnce({ result: { id: 'folder-parent', name: 'Parent' } })
      .mockResolvedValueOnce({ result: { id: 'folder-child', name: 'Child' } });

    const folderId = await gdm.findOrCreateConfiguredCharacterFolder();

    expect(folderId).toBe('folder-child');
    expect(gapi.client.drive.files.create).toHaveBeenNthCalledWith(1, {
      resource: {
        name: 'Parent',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['root'],
      },
      fields: 'id, name',
    });
    expect(gapi.client.drive.files.create).toHaveBeenNthCalledWith(2, {
      resource: {
        name: 'Child',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['folder-parent'],
      },
      fields: 'id, name',
    });
  });

  test('createCharacterFile uploads to configured folder', async () => {
    vi.spyOn(gdm, 'findOrCreateConfiguredCharacterFolder').mockResolvedValue('folder');
    gapi.client.request.mockResolvedValueOnce({ result: { id: 'file-1', name: 'Hero.zip' } });

    const res = await gdm.createCharacterFile({ content: new Uint8Array([0x01, 0x02]), mimeType: 'application/zip', name: 'Hero' });

    expect(res.id).toBe('file-1');
    const requestCall = gapi.client.request.mock.calls.at(-1)[0];
    expect(requestCall.body).toContain('"parents":["folder"]');
    expect(requestCall.body).toContain('Content-Type: application/zip');
  });

  test('renameFile updates file metadata without uploading content', async () => {
    gapi.client.drive.files.update.mockResolvedValue({ result: { id: 'file-rename', name: 'Knight.zip' } });

    const result = await gdm.renameFile('file-rename', 'Knight.zip');

    expect(gapi.client.drive.files.update).toHaveBeenCalledWith({
      fileId: 'file-rename',
      fields: 'id, name',
      resource: { name: 'Knight.zip' },
    });
    expect(result).toEqual({ id: 'file-rename', name: 'Knight.zip' });
  });

  test('singleton enforcement prevents multiple instances', () => {
    expect(getGoogleDriveManagerInstance()).toBeInstanceOf(GoogleDriveManager);
    expect(() => new GoogleDriveManager('other', 'other')).toThrow('already been instantiated');
    expect(initializeGoogleDriveManager('second', 'second')).toBe(gdm);
    expect(getGoogleDriveManagerInstance()).toBe(gdm);
  });
});
