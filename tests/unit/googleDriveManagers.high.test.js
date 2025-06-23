import { GoogleDriveManager } from '../../src/services/googleDriveManager.js';
import { MockGoogleDriveManager } from '../../src/services/mockGoogleDriveManager.js';
import { vi } from 'vitest';

describe.each([
  { name: 'GoogleDriveManager', manager: () => new GoogleDriveManager('k', 'c') },
  { name: 'MockGoogleDriveManager', manager: () => new MockGoogleDriveManager('k', 'c') },
])('$name High-Level API', ({ manager }) => {
  let gdm;
  beforeEach(() => {
    gdm = manager();
    if (gdm._initState) gdm._initState();
    if (gdm instanceof GoogleDriveManager) {
      const store = {};
      gdm._saveFile = vi.fn(async (folder, name, content, id = null) => {
        const fid = id || 'file-' + Object.keys(store).length + 1;
        store[fid] = content;
        return { id: fid, name };
      });
      gdm._loadFileContent = vi.fn(async (id) => store[id] || null);
      gdm._deleteCharacterFile = vi.fn(async (id) => {
        delete store[id];
      });
      let index = [];
      gdm._ensureIndexFile = vi.fn(async () => ({ id: 'index', name: 'idx' }));
      gdm._readIndexFile = vi.fn(async () => (Array.isArray(index) ? index : []));
      gdm._writeIndexFile = vi.fn(async (data) => {
        index = data;
      });
      global.gapi = {};
    }
  });

  test('新規キャラクターをsaveCharacterで保存すると、listCharactersで取得できる', async () => {
    const newChar = { id: 'char1', name: '新規キャラ' };
    const metadata = await gdm.saveCharacter(newChar, null);
    const list = await gdm.listCharacters();
    expect(list[0].characterName).toBe('新規キャラ');
    expect(list[0].fileId).toBe(metadata.fileId);
  });

  test('保存したキャラクターをgetCharacterで取得すると、同一のデータが返る', async () => {
    const newChar = { id: 'char2', name: '取得テストキャラ', data: { value: 123 } };
    const { fileId } = await gdm.saveCharacter(newChar, null);
    const fetched = await gdm.getCharacter(fileId);
    expect(fetched).toEqual(newChar);
  });

  test('既存キャラクターをsaveCharacterで更新すると、characterNameが変更される', async () => {
    const char = { id: 'char3', name: '旧名前' };
    const { fileId } = await gdm.saveCharacter(char, null);
    const updated = { ...char, name: '新名前' };
    await gdm.saveCharacter(updated, fileId);
    const list = await gdm.listCharacters();
    expect(list[0].characterName).toBe('新名前');
  });

  test('deleteCharacterでキャラクターを削除すると、listCharactersから消える', async () => {
    const char = { id: 'char4', name: '削除されるキャラ' };
    const { fileId } = await gdm.saveCharacter(char, null);
    await gdm.deleteCharacter(fileId);
    const list = await gdm.listCharacters();
    expect(list).toHaveLength(0);
  });
});
