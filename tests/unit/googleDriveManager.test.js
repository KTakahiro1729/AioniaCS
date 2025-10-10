import {
  GoogleDriveManager,
  initializeGoogleDriveManager,
  getGoogleDriveManagerInstance,
  resetGoogleDriveManagerForTests,
} from '@/infrastructure/google-drive/googleDriveManager.js';
import { vi } from 'vitest';

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function textResponse(text) {
  return new Response(text, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GoogleDriveManager (REST implementation)', () => {
  beforeEach(() => {
    resetGoogleDriveManagerForTests();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetGoogleDriveManagerForTests();
  });

  test('initializeGoogleDriveManager creates singleton', () => {
    const manager = initializeGoogleDriveManager();
    expect(manager).toBeInstanceOf(GoogleDriveManager);
    expect(getGoogleDriveManagerInstance()).toBe(manager);
  });

  test('loadConfig creates default config when missing', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ files: [] })).mockResolvedValueOnce(jsonResponse({ id: 'cfg-1', name: 'aioniacs.cfg' }));

    const manager = initializeGoogleDriveManager();
    manager.setAccessToken('token');
    const config = await manager.loadConfig();

    expect(config.characterFolderPath).toBe('慈悲なきアイオニア');
    expect(fetch).toHaveBeenCalledTimes(2);
    const uploadUrl = new URL(fetch.mock.calls[1][0]);
    expect(uploadUrl.pathname).toBe('/upload/drive/v3/files');
  });

  test('loadConfig reads existing config file', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'cfg-2', name: 'aioniacs.cfg' }] }))
      .mockResolvedValueOnce(textResponse('{"characterFolderPath":"Custom/Path"}'));

    const manager = initializeGoogleDriveManager();
    manager.setAccessToken('token');
    const config = await manager.loadConfig();

    expect(config.characterFolderPath).toBe('Custom/Path');
    expect(fetch).toHaveBeenCalledTimes(2);
    const listUrl = new URL(fetch.mock.calls[0][0]);
    expect(listUrl.pathname).toBe('/drive/v3/files');
  });

  test('setCharacterFolderPath updates config and clears cache', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'cfg-3', name: 'aioniacs.cfg' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'cfg-3', name: 'aioniacs.cfg' }));

    const manager = initializeGoogleDriveManager();
    manager.setAccessToken('token');
    await manager.loadConfig();
    manager.configuredFolderId = 'old';
    manager.cachedFolderPath = 'Old Path';

    const normalized = await manager.setCharacterFolderPath('New Path');

    expect(normalized).toBe('New Path');
    expect(manager.configuredFolderId).toBeNull();
    expect(manager.cachedFolderPath).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(3);
    const updateUrl = new URL(fetch.mock.calls[2][0]);
    expect(updateUrl.pathname).toBe('/upload/drive/v3/files/cfg-3');
  });

  test('findOrCreateConfiguredCharacterFolder creates nested folders', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // loadConfig
      .mockResolvedValueOnce(jsonResponse({ id: 'cfg-4', name: 'aioniacs.cfg' })) // saveConfig
      .mockResolvedValueOnce(jsonResponse({ id: 'cfg-4', name: 'aioniacs.cfg' })) // saveConfig during setCharacterFolderPath
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // find Parent
      .mockResolvedValueOnce(jsonResponse({ id: 'folder-parent', name: 'Parent' })) // create Parent
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // find Child
      .mockResolvedValueOnce(jsonResponse({ id: 'folder-child', name: 'Child' })); // create Child

    const manager = initializeGoogleDriveManager();
    manager.setAccessToken('token');
    await manager.setCharacterFolderPath('Parent/Child');
    const folderId = await manager.findOrCreateConfiguredCharacterFolder();

    expect(folderId).toBe('folder-child');
  });

  test('createCharacterFile uploads to configured folder', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'cfg-5', name: 'aioniacs.cfg' }))
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'folder', name: '慈悲なきアイオニア' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'file-1', name: 'Hero.zip' }));

    const manager = initializeGoogleDriveManager();
    manager.setAccessToken('token');
    await manager.loadConfig();
    const result = await manager.createCharacterFile({ content: new Uint8Array([0x01, 0x02]), mimeType: 'application/zip', name: 'Hero' });

    expect(result).toEqual({ id: 'file-1', name: 'Hero.zip' });
    const lastCall = fetch.mock.calls.at(-1);
    const uploadUrl = new URL(lastCall[0]);
    expect(uploadUrl.pathname).toBe('/upload/drive/v3/files');
    expect(lastCall[1].method).toBe('POST');
  });

  test('findFileByName returns match from configured folder', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'cfg-6', name: 'aioniacs.cfg' }))
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'folder', name: '慈悲なきアイオニア' }))
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'found', name: 'Hero.zip' }] }));

    const manager = initializeGoogleDriveManager();
    manager.setAccessToken('token');
    await manager.loadConfig();
    const file = await manager.findFileByName('Hero.zip');

    expect(file).toEqual({ id: 'found', name: 'Hero.zip' });
  });
});
