import { GoogleDriveManager } from '../../src/services/googleDriveManager.js';
import { vi } from 'vitest';

describe('GoogleDriveManager Drive folder operations', () => {
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

  test('getOrCreateAppFolder creates folder when not found', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.drive.files.create.mockResolvedValue({ result: { id: 'folder1' } });
    const id = await gdm.getOrCreateAppFolder('AioniaCS');
    expect(id).toBe('folder1');
    expect(gapi.client.drive.files.create).toHaveBeenCalled();
  });

  test('listFiles uses ensured folder', async () => {
    vi.spyOn(gdm, 'getOrCreateAppFolder').mockResolvedValue('folder1');
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [{ id: '1', name: 'a.json' }] } });
    const files = await gdm.listFiles();
    expect(gdm.getOrCreateAppFolder).toHaveBeenCalled();
    expect(files).toEqual([{ id: '1', name: 'a.json' }]);
  });

  test('saveFile creates new file when id missing', async () => {
    vi.spyOn(gdm, 'getOrCreateAppFolder').mockResolvedValue('folder1');
    gapi.client.request.mockResolvedValue({ result: { id: 'f1', name: 'hero.json' } });
    const res = await gdm.saveFile(null, 'hero.json', '{}');
    expect(gdm.getOrCreateAppFolder).toHaveBeenCalled();
    expect(gapi.client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/upload/drive/v3/files',
        method: 'POST',
      }),
    );
    expect(res).toEqual({ id: 'f1', name: 'hero.json' });
  });

  test('loadFileContent returns body string', async () => {
    gapi.client.drive.files.get.mockResolvedValue({ body: '{"a":1}' });
    const content = await gdm.loadFileContent('file');
    expect(content).toBe('{"a":1}');
  });

  test('deleteCharacterFile calls Drive API', async () => {
    gapi.client.drive.files.delete.mockResolvedValue({});
    await gdm.deleteCharacterFile('f1');
    expect(gapi.client.drive.files.delete).toHaveBeenCalledWith({ fileId: 'f1' });
  });
});
