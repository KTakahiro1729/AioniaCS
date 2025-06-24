import { GoogleDriveManager } from '../../src/services/googleDriveManager.js';
import { vi } from 'vitest';

describe('GoogleDriveManager appDataFolder', () => {
  let gdm;

  beforeEach(() => {
    global.gapi = {
      client: {
        drive: {
          files: {
            list: vi.fn(),
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

  test('ensureIndexFile creates new index when absent', async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValue({
      result: { id: '1', name: 'character_index.json' },
    });
    const info = await gdm.ensureIndexFile();
    expect(info.id).toBe('1');
    expect(gapi.client.request).toHaveBeenCalled();
  });

  test('readIndexFile returns parsed data', async () => {
    gapi.client.drive.files.list.mockResolvedValue({
      result: { files: [{ id: '10', name: 'character_index.json' }] },
    });
    gapi.client.drive.files.get.mockResolvedValue({
      body: '[{"id":"a","characterName":"Alice"}]',
    });
    const index = await gdm.readIndexFile();
    expect(index).toEqual([{ id: 'a', characterName: 'Alice' }]);
    expect(gapi.client.drive.files.get).toHaveBeenCalledWith({
      fileId: '10',
      alt: 'media',
    });
  });

  test('createCharacterFile uploads JSON to appDataFolder', async () => {
    gapi.client.request.mockResolvedValue({
      result: { id: 'c1', name: 'Test.json' },
    });
    const data = { character: { name: 'Test' } };
    const res = await gdm.createCharacterFile(data);
    expect(res.id).toBe('c1');
    expect(gapi.client.request).toHaveBeenCalled();
  });

  test('deleteCharacterFile removes file and index entry', async () => {
    vi.spyOn(gdm, 'removeIndexEntry').mockResolvedValue();
    gapi.client.drive.files.delete.mockResolvedValue({});
    await gdm.deleteCharacterFile('d1');
    expect(gapi.client.drive.files.delete).toHaveBeenCalledWith({
      fileId: 'd1',
    });
    expect(gdm.removeIndexEntry).toHaveBeenCalledWith('d1');
  });

  test('renameIndexEntry updates characterName and timestamp', async () => {
    const now = new Date('2024-01-01T00:00:00.000Z');
    vi.useFakeTimers().setSystemTime(now);
    vi.spyOn(gdm, 'readIndexFile').mockResolvedValue([{ id: 'a', characterName: 'Old' }]);
    vi.spyOn(gdm, 'writeIndexFile').mockResolvedValue();
    await gdm.renameIndexEntry('a', 'New');
    expect(gdm.writeIndexFile).toHaveBeenCalledWith([
      {
        id: 'a',
        characterName: 'New',
        updatedAt: now.toISOString(),
      },
    ]);
    vi.useRealTimers();
  });

  test('addIndexEntry sets updatedAt', async () => {
    const now = new Date('2024-01-02T00:00:00.000Z');
    vi.useFakeTimers().setSystemTime(now);
    vi.spyOn(gdm, 'readIndexFile').mockResolvedValue([]);
    vi.spyOn(gdm, 'writeIndexFile').mockResolvedValue();
    await gdm.addIndexEntry({ id: 'b', characterName: 'Bob' });
    expect(gdm.writeIndexFile).toHaveBeenCalledWith([
      {
        id: 'b',
        characterName: 'Bob',
        updatedAt: now.toISOString(),
      },
    ]);
    vi.useRealTimers();
  });

  test('onGapiLoad rejects when gapi.load is missing', async () => {
    delete gapi.load;
    await expect(gdm.onGapiLoad()).rejects.toThrow('GAPI core script not available for gapi.load.');
  });
});
