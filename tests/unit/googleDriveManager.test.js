import { GoogleDriveManager } from '../../src/services/googleDriveManager.js';
import { vi } from 'vitest';

describe('GoogleDriveManager Drive folder management', () => {
  let gdm;

  beforeEach(() => {
    global.gapi = {
      client: {
        drive: {
          files: {
            list: vi.fn(),
            create: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
          },
        },
        request: vi.fn(),
      },
    };
    gdm = new GoogleDriveManager('k', 'c');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('findOrCreateAioniaCSFolder returns existing folder id when present', async () => {
    gapi.client.drive.files.list.mockResolvedValue({
      result: { files: [{ id: 'folder-1', name: '.AioniaCS' }] },
    });

    const folderId = await gdm.findOrCreateAioniaCSFolder();
    expect(folderId).toBe('folder-1');
    expect(gapi.client.drive.files.create).not.toHaveBeenCalled();

    // Cached value should avoid additional list calls
    gapi.client.drive.files.list.mockClear();
    const cachedId = await gdm.findOrCreateAioniaCSFolder();
    expect(cachedId).toBe('folder-1');
    expect(gapi.client.drive.files.list).not.toHaveBeenCalled();
  });

  test('findOrCreateAioniaCSFolder creates folder when missing', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'new-folder', name: '.AioniaCS' } });

    const folderId = await gdm.findOrCreateAioniaCSFolder();
    expect(folderId).toBe('new-folder');
    expect(gapi.client.drive.files.create).toHaveBeenCalledWith({
      resource: {
        name: '.AioniaCS',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['root'],
      },
      fields: 'id, name',
    });
  });

  test('findFileByName returns file info when found', async () => {
    gdm.aioniaFolderId = 'folder-123';
    gapi.client.drive.files.list.mockResolvedValue({
      result: { files: [{ id: 'file-1', name: 'Test.json' }] },
    });

    const file = await gdm.findFileByName('Test.json');
    expect(file).toEqual({ id: 'file-1', name: 'Test.json' });
    expect(gapi.client.drive.files.list).toHaveBeenCalledWith({
      q: "'folder-123' in parents and name='Test.json' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive',
    });
  });

  test('findFileByName returns null when not found', async () => {
    gdm.aioniaFolderId = 'folder-123';
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });

    const file = await gdm.findFileByName('Missing.json');
    expect(file).toBeNull();
  });

  test('createCharacterFile uploads JSON to .AioniaCS folder', async () => {
    vi.spyOn(gdm, 'findOrCreateAioniaCSFolder').mockResolvedValue('folder-abc');
    gapi.client.request.mockResolvedValue({ result: { id: 'c1', name: 'Test.json' } });
    const data = { character: { name: 'Test' } };
    const res = await gdm.createCharacterFile(data);
    expect(res.id).toBe('c1');
    expect(gdm.findOrCreateAioniaCSFolder).toHaveBeenCalled();
    const call = gapi.client.request.mock.calls[0][0];
    expect(call.body).toContain('"parents":["folder-abc"]');
  });

  test('updateCharacterFile patches existing file in .AioniaCS folder', async () => {
    vi.spyOn(gdm, 'findOrCreateAioniaCSFolder').mockResolvedValue('folder-abc');
    gapi.client.request.mockResolvedValue({ result: { id: 'c1', name: 'Test.json' } });

    await gdm.updateCharacterFile('file-123', { character: { name: 'Test' } });

    const call = gapi.client.request.mock.calls[0][0];
    expect(call.path).toBe('/upload/drive/v3/files/file-123');
    expect(call.method).toBe('PATCH');
  });

  test('deleteCharacterFile removes file only', async () => {
    gapi.client.drive.files.delete.mockResolvedValue({});
    await gdm.deleteCharacterFile('d1');
    expect(gapi.client.drive.files.delete).toHaveBeenCalledWith({
      fileId: 'd1',
    });
  });

  test('onGapiLoad rejects when gapi.load is missing', async () => {
    delete gapi.load;
    await expect(gdm.onGapiLoad()).rejects.toThrow('GAPI core script not available for gapi.load.');
  });
});
