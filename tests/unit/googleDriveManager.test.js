import {
  GoogleDriveManager,
  initializeGoogleDriveManager,
  getGoogleDriveManagerInstance,
  resetGoogleDriveManagerForTests,
} from '@/infrastructure/google-drive/googleDriveManager.js';
import { vi } from 'vitest';

describe('GoogleDriveManager configuration and folder handling', () => {
  let gdm;

  beforeEach(() => {
    resetGoogleDriveManagerForTests();
    global.fetch = vi.fn();
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
  });

  test('loadConfig creates default config when missing', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValue({ result: { id: 'cfg-1', name: 'aioniacs.cfg' } });

    const config = await gdm.loadConfig();

    expect(config.characterFolderPath).toBe('慈悲なきアイオニア');
    expect(gdm.configFileId).toBe('cfg-1');
    expect(gapi.client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/upload/drive/v3/files',
      }),
    );
  });

  test('loadConfig reads existing config file', async () => {
    gapi.client.drive.files.list.mockResolvedValue({
      result: { files: [{ id: 'cfg-2', name: 'aioniacs.cfg' }] },
    });
    gapi.client.drive.files.get.mockResolvedValue({ body: JSON.stringify({ characterFolderPath: 'My Folder' }) });

    const config = await gdm.loadConfig();

    expect(config.characterFolderPath).toBe('My Folder');
    expect(gdm.configFileId).toBe('cfg-2');
    expect(gapi.client.request).not.toHaveBeenCalled();
  });

  test('setCharacterFolderPath updates config and clears cache', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValueOnce({ result: { id: 'cfg-3', name: 'aioniacs.cfg' } });

    await gdm.loadConfig();
    gdm.aioniaFolderId = 'old';
    gdm.cachedFolderPath = 'Old Path';

    gapi.client.request.mockResolvedValueOnce({ result: { id: 'cfg-3', name: 'aioniacs.cfg' } });

    await gdm.setCharacterFolderPath('New Path');

    expect(gdm.config.characterFolderPath).toBe('New Path');
    expect(gdm.aioniaFolderId).toBeNull();
    expect(gdm.cachedFolderPath).toBeNull();
    expect(gapi.client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/upload/drive/v3/files/cfg-3',
        method: 'PATCH',
      }),
    );
  });

  test('findOrCreateConfiguredCharacterFolder builds nested folders from configured path', async () => {
    gapi.client.drive.files.list.mockImplementation(({ q }) => {
      if (q.includes("name='aioniacs.cfg'")) {
        return Promise.resolve({ result: { files: [] } });
      }
      if (q.includes("name='Parent'")) {
        return Promise.resolve({ result: { files: [] } });
      }
      if (q.includes("name='Child'")) {
        return Promise.resolve({ result: { files: [] } });
      }
      throw new Error(`Unexpected query: ${q}`);
    });
    gapi.client.request.mockResolvedValueOnce({ result: { id: 'cfg-4', name: 'aioniacs.cfg' } });
    gapi.client.request.mockResolvedValue({ result: { id: 'unused', name: 'cfg' } });

    gapi.client.drive.files.create
      .mockResolvedValueOnce({ result: { id: 'folder-parent', name: 'Parent' } })
      .mockResolvedValueOnce({ result: { id: 'folder-child', name: 'Child' } });

    await gdm.loadConfig();
    await gdm.setCharacterFolderPath('Parent\\Child');

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
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValueOnce({ result: { id: 'cfg-5', name: 'aioniacs.cfg' } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'folder', name: '慈悲なきアイオニア' } });
    gapi.client.request.mockResolvedValueOnce({ result: { id: 'file-1', name: 'Hero.zip' } });

    const res = await gdm.createCharacterFile({ content: new Uint8Array([0x01, 0x02]), mimeType: 'application/zip', name: 'Hero' });

    expect(res.id).toBe('file-1');
    const requestCall = gapi.client.request.mock.calls.at(-1)[0];
    expect(requestCall.body).toContain('"parents":["folder"]');
    expect(requestCall.body).toContain('Content-Type: application/zip');
  });

  test('updateCharacterFile patches existing file', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValueOnce({ result: { id: 'cfg-6', name: 'aioniacs.cfg' } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'folder', name: '慈悲なきアイオニア' } });
    gapi.client.request.mockResolvedValueOnce({ result: { id: 'file-1', name: 'Hero.zip' } });

    await gdm.updateCharacterFile('file-1', { content: new Uint8Array([0x03, 0x04]), mimeType: 'application/zip', name: 'Hero' });

    const call = gapi.client.request.mock.calls.at(-1)[0];
    expect(call.path).toBe('/upload/drive/v3/files/file-1');
    expect(call.method).toBe('PATCH');
    expect(call.body).toContain('Content-Type: application/zip');
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

  test('findFileByName queries configured folder', async () => {
    gapi.client.drive.files.list
      .mockResolvedValueOnce({ result: { files: [] } })
      .mockResolvedValueOnce({ result: { files: [] } })
      .mockResolvedValueOnce({
        result: { files: [{ id: 'found', name: 'Hero.zip' }] },
      });
    gapi.client.request.mockResolvedValue({ result: { id: 'cfg-7', name: 'aioniacs.cfg' } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'folder', name: '慈悲なきアイオニア' } });

    const file = await gdm.findFileByName('Hero.zip');

    expect(file).toEqual({ id: 'found', name: 'Hero.zip' });
    expect(gapi.client.drive.files.list).toHaveBeenCalledWith({
      q: "'folder' in parents and name='Hero.zip' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive',
    });
  });

  test('isFileInConfiguredFolder detects mismatched parent', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValueOnce({ result: { id: 'cfg-8', name: 'aioniacs.cfg' } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'folder-x', name: '慈悲なきアイオニア' } });
    gapi.client.drive.files.get.mockResolvedValue({ result: { parents: ['other-folder'] } });

    const result = await gdm.isFileInConfiguredFolder('file-xyz');

    expect(result).toBe(false);
    expect(gapi.client.drive.files.get).toHaveBeenCalledWith({ fileId: 'file-xyz', fields: 'id, parents' });
  });

  test('deleteCharacterFile removes file from drive', async () => {
    gapi.client.drive.files.delete.mockResolvedValue({});
    await gdm.deleteCharacterFile('del-1');
    expect(gapi.client.drive.files.delete).toHaveBeenCalledWith({ fileId: 'del-1' });
  });

  test('onGapiLoad rejects when gapi.load missing', async () => {
    delete gapi.load;
    await expect(gdm.onGapiLoad()).rejects.toThrow('GAPI core script not available for gapi.load.');
  });

  test('singleton pattern remains enforced', () => {
    expect(() => new GoogleDriveManager('other', 'other')).toThrow('already been instantiated');
    expect(initializeGoogleDriveManager('second', 'second')).toBe(gdm);
    expect(getGoogleDriveManagerInstance()).toBe(gdm);
  });
});
