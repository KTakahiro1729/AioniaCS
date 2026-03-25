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
          permissions: {
            list: vi.fn(),
            delete: vi.fn(),
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

    expect(config.characterFolderId).toBeNull();
    expect(gdm.configFileId).toBe('cfg-1');
    expect(gapi.client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/upload/drive/v3/files',
      }),
    );
  });

  test('loadConfig reads existing config file with stored folder ID', async () => {
    gapi.client.drive.files.list.mockResolvedValue({
      result: { files: [{ id: 'cfg-2', name: 'aioniacs.cfg' }] },
    });
    gapi.client.drive.files.get.mockResolvedValue({ body: JSON.stringify({ characterFolderId: 'folder-saved' }) });

    const config = await gdm.loadConfig();

    expect(config.characterFolderId).toBe('folder-saved');
    expect(gdm.configFileId).toBe('cfg-2');
    expect(gapi.client.request).not.toHaveBeenCalled();
  });

  test('findOrCreateConfiguredCharacterFolder uses stored folder ID', async () => {
    gapi.client.drive.files.list.mockResolvedValue({
      result: { files: [{ id: 'cfg-id', name: 'aioniacs.cfg' }] },
    });
    gapi.client.drive.files.get
      .mockResolvedValueOnce({ body: JSON.stringify({ characterFolderId: 'existing-folder' }) })
      .mockResolvedValueOnce({ result: { id: 'existing-folder', trashed: false } });

    const folderId = await gdm.findOrCreateConfiguredCharacterFolder();

    expect(folderId).toBe('existing-folder');
    expect(gapi.client.drive.files.create).not.toHaveBeenCalled();
  });

  test('findOrCreateConfiguredCharacterFolder creates new folder when stored ID is invalid', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValue({ result: { id: 'cfg-new', name: 'aioniacs.cfg' } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'new-folder', name: '慈悲なきアイオニア' } });

    const folderId = await gdm.findOrCreateConfiguredCharacterFolder();

    expect(folderId).toBe('new-folder');
    expect(gapi.client.drive.files.create).toHaveBeenCalledWith({
      resource: {
        name: '慈悲なきアイオニア',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['root'],
      },
      fields: 'id, name',
    });
  });

  test('createCharacterFile uploads to configured folder', async () => {
    // loadConfig: no config file found → saves default config
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValue({ result: { id: 'cfg-5', name: 'aioniacs.cfg' } });
    // createFolder for character folder
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'folder', name: '慈悲なきアイオニア' } });

    const res = await gdm.createCharacterFile({ content: new Uint8Array([0x01, 0x02]), mimeType: 'application/zip', name: 'Hero' });

    // The last gapi.client.request call should be the file upload
    const requestCalls = gapi.client.request.mock.calls;
    const uploadCall = requestCalls.find((c) => c[0].body && c[0].body.includes('"parents":["folder"]'));
    expect(uploadCall).toBeTruthy();
    expect(uploadCall[0].body).toContain('Content-Type: application/zip');
    expect(res).toBeTruthy();
  });

  test('saveFile injects url-safe thumbnail content hints when provided', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValue({ result: { id: 'cfg-thumb', name: 'aioniacs.cfg' } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'folder-thumb', name: '慈悲なきアイオニア' } });

    await gdm.createCharacterFile({
      content: '{}',
      mimeType: 'application/zip',
      name: 'Hero',
      thumbnail: 'data:image/png;base64,a+b/=',
      thumbnailMimeType: 'image/png',
    });

    const requestCalls = gapi.client.request.mock.calls;
    const uploadCall = requestCalls.find((c) => c[0].body && c[0].body.includes('"contentHints"'));
    expect(uploadCall).toBeTruthy();
    expect(uploadCall[0].body).toContain('"contentHints":{"thumbnail":{"image":"a-b_=","mimeType":"image/png"}}');
  });

  test('updateCharacterFile patches existing file', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValue({ result: { id: 'cfg-6', name: 'aioniacs.cfg' } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'folder', name: '慈悲なきアイオニア' } });

    await gdm.updateCharacterFile('file-1', { content: new Uint8Array([0x03, 0x04]), mimeType: 'application/zip', name: 'Hero' });

    const requestCalls = gapi.client.request.mock.calls;
    const patchCall = requestCalls.find((c) => c[0].path === '/upload/drive/v3/files/file-1');
    expect(patchCall).toBeTruthy();
    expect(patchCall[0].method).toBe('PATCH');
    expect(patchCall[0].body).toContain('Content-Type: application/zip');
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
    // loadConfig: no config → save default
    gapi.client.drive.files.list.mockResolvedValueOnce({ result: { files: [] } }).mockResolvedValueOnce({
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
    gapi.client.request.mockResolvedValue({ result: { id: 'cfg-8', name: 'aioniacs.cfg' } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'folder-x', name: '慈悲なきアイオニア' } });
    gapi.client.drive.files.get.mockResolvedValue({ result: { parents: ['other-folder'] } });

    const result = await gdm.isFileInConfiguredFolder('file-xyz');

    expect(result).toBe(false);
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

  test('unshareFile removes anyone permission', async () => {
    gapi.client.drive.permissions.list.mockResolvedValue({
      result: { permissions: [{ id: 'perm-anyone', type: 'anyone' }] },
    });
    gapi.client.drive.permissions.delete.mockResolvedValue({});

    const result = await gdm.unshareFile('file-share');

    expect(gapi.client.drive.permissions.list).toHaveBeenCalledWith({
      fileId: 'file-share',
      fields: 'permissions(id, type, role)',
    });
    expect(gapi.client.drive.permissions.delete).toHaveBeenCalledWith({ fileId: 'file-share', permissionId: 'perm-anyone' });
    expect(result).toBe(true);
  });

  test('singleton pattern remains enforced', () => {
    expect(() => new GoogleDriveManager('other', 'other')).toThrow('already been instantiated');
    expect(initializeGoogleDriveManager('second', 'second')).toBe(gdm);
    expect(getGoogleDriveManagerInstance()).toBe(gdm);
  });
});
