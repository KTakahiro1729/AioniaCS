import { GoogleDriveManager, DRIVE_FOLDER_NAME } from '../../src/services/googleDriveManager.js';
import { vi } from 'vitest';

describe('GoogleDriveManager', () => {
  let gdm;

  beforeEach(() => {
    global.gapi = {
      load: vi.fn((_, cb) => cb()),
      client: {
        getToken: vi.fn(() => ({ access_token: 'token' })),
        setToken: vi.fn(),
        drive: {
          files: {
            list: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
          },
        },
        request: vi.fn(),
      },
    };
    global.google = {
      picker: {
        View: vi.fn(),
        ViewId: { DOCS: 'DOCS' },
        Feature: { NAV_HIDDEN: 'NAV_HIDDEN' },
        Response: { ACTION: 'action', DOCUMENTS: 'docs' },
        Action: { PICKED: 'picked', CANCEL: 'cancel' },
        PickerBuilder: vi.fn().mockReturnValue({ build: vi.fn().mockReturnValue({ setVisible: vi.fn() }) }),
      },
      accounts: { oauth2: { initTokenClient: vi.fn().mockReturnValue({}) } },
    };

    gdm = new GoogleDriveManager('k', 'c');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('ensureAppFolder returns existing folder id', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [{ id: 'folder-1', name: DRIVE_FOLDER_NAME }] } });

    const id = await gdm.ensureAppFolder();

    expect(id).toBe('folder-1');
    expect(gapi.client.drive.files.create).not.toHaveBeenCalled();
  });

  test('ensureAppFolder creates folder when missing', async () => {
    gapi.client.drive.files.list.mockResolvedValueOnce({ result: { files: [] } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'new-folder', name: DRIVE_FOLDER_NAME } });

    const id = await gdm.ensureAppFolder();

    expect(id).toBe('new-folder');
    expect(gapi.client.drive.files.create).toHaveBeenCalled();
  });

  test('listFiles requests files inside ensured folder', async () => {
    gapi.client.drive.files.list
      .mockResolvedValueOnce({ result: { files: [{ id: 'folder-1', name: DRIVE_FOLDER_NAME }] } })
      .mockResolvedValueOnce({ result: { files: [{ id: 'file-1', name: 'hero.json', modifiedTime: '2024-01-01T00:00:00Z' }] } });

    const files = await gdm.listFiles();

    expect(files).toEqual([{ id: 'file-1', name: 'hero.json', modifiedTime: '2024-01-01T00:00:00Z' }]);
    expect(gapi.client.drive.files.list).toHaveBeenLastCalledWith({
      q: "'folder-1' in parents and mimeType='application/json' and trashed=false",
      fields: 'files(id, name, modifiedTime)',
      spaces: 'drive',
      orderBy: 'modifiedTime desc',
    });
  });

  test('saveFile creates new file with metadata', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [{ id: 'folder-1', name: DRIVE_FOLDER_NAME }] } });
    gapi.client.request.mockResolvedValue({ result: { id: 'file-1', name: 'hero.json' } });

    const result = await gdm.saveFile(null, 'hero.json', '{"test":true}');

    expect(result).toEqual({ id: 'file-1', name: 'hero.json' });
    expect(gapi.client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/upload/drive/v3/files',
        params: expect.objectContaining({ uploadType: 'multipart' }),
      }),
    );
  });

  test('saveFile updates existing file when id provided', async () => {
    gapi.client.request.mockResolvedValue({ result: { id: 'file-1', name: 'hero.json' } });

    const result = await gdm.saveFile('folder-1', 'hero.json', '{"test":true}', 'file-1');

    expect(result).toEqual({ id: 'file-1', name: 'hero.json' });
    expect(gapi.client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        path: '/upload/drive/v3/files/file-1',
      }),
    );
  });

  test('deleteCharacterFile removes drive file', async () => {
    gapi.client.drive.files.delete.mockResolvedValue({});
    await gdm.deleteCharacterFile('file-2');
    expect(gapi.client.drive.files.delete).toHaveBeenCalledWith({ fileId: 'file-2' });
  });

  test('onGapiLoad rejects when gapi.load is missing', async () => {
    delete gapi.load;
    await expect(gdm.onGapiLoad()).rejects.toThrow('GAPI core script not available for gapi.load.');
  });
});
