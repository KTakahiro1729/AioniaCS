import { GoogleDriveManager } from '../../src/services/googleDriveManager.js';
import { MockGoogleDriveManager } from '../../src/services/mockGoogleDriveManager.js';
import { describe, beforeEach, test, expect, vi } from 'vitest';

describe.each([
  [
    'GoogleDriveManager',
    () => {
      const real = new GoogleDriveManager('k', 'c');
      const helper = new MockGoogleDriveManager();
      real._ensureIndexFile = helper._ensureIndexFile.bind(helper);
      real.loadFileContent = helper.loadFileContent.bind(helper);
      real._saveFile = helper._saveFile.bind(helper);
      real._readIndexFile = helper._readIndexFile.bind(helper);
      real._writeIndexFile = helper._writeIndexFile.bind(helper);
      real._addIndexEntry = helper._addIndexEntry.bind(helper);
      real._renameIndexEntry = helper._renameIndexEntry.bind(helper);
      real._removeIndexEntry = helper._removeIndexEntry.bind(helper);
      real._createCharacterFile = helper._createCharacterFile.bind(helper);
      real._updateCharacterFile = helper._updateCharacterFile.bind(helper);
      real._loadCharacterFile = helper._loadCharacterFile.bind(helper);
      real._deleteCharacterFile = helper._deleteCharacterFile.bind(helper);
      return { manager: real, helper };
    },
  ],
  [
    'MockGoogleDriveManager',
    () => {
      const helper = new MockGoogleDriveManager();
      return { manager: helper, helper };
    },
  ],
])('%s API contract', (name, factory) => {
  let mgr;
  let helper;
  beforeEach(() => {
    const obj = factory();
    mgr = obj.manager;
    helper = obj.helper;
  });

  test('listCharacters returns metadata array', async () => {
    await helper._writeIndexFile([{ id: '1', name: 'a.json', characterName: 'A', updatedAt: 't' }]);
    const res = await mgr.listCharacters();
    expect(res).toEqual([{ fileId: '1', characterName: 'A', lastModified: 't' }]);
  });

  test('listCharacters returns empty when missing file', async () => {
    helper.indexContent = null;
    const res = await mgr.listCharacters();
    expect(res).toEqual([]);
  });

  test('listCharacters ignores invalid JSON', async () => {
    helper.indexContent = 'invalid';
    helper.files.set('index', 'invalid');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await mgr.listCharacters();
    expect(res).toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('listCharacters filters invalid entries', async () => {
    await helper._writeIndexFile([{ id: '1', characterName: 'A', updatedAt: 't' }, { characterName: 'B' }, { id: '2' }]);
    const res = await mgr.listCharacters();
    expect(res).toEqual([{ fileId: '1', characterName: 'A', lastModified: 't' }]);
  });

  test('getCharacter returns object when exists', async () => {
    const meta = await mgr.saveCharacter({ id: 'c', name: 'A' }, null);
    const data = await mgr.getCharacter(meta.fileId);
    expect(data.name).toBe('A');
  });

  test('getCharacter returns null when file missing', async () => {
    const data = await mgr.getCharacter('nope');
    expect(data).toBeNull();
  });

  test('getCharacter throws on invalid JSON', async () => {
    const { id } = await helper._saveFile('mock', 'bad.json', '');
    await expect(mgr.getCharacter(id)).rejects.toThrow();
  });

  test('saveCharacter creates new entry and returns metadata', async () => {
    const meta = await mgr.saveCharacter({ id: 'n1', name: 'New' }, null);
    expect(meta.characterName).toBe('New');
    const list = await mgr.listCharacters();
    expect(list[0].fileId).toBe(meta.fileId);
  });

  test('saveCharacter updates existing entry', async () => {
    const meta = await mgr.saveCharacter({ id: 'u1', name: 'Old' }, null);
    const updated = await mgr.saveCharacter({ id: 'u1', name: 'Updated' }, meta.fileId);
    expect(updated.characterName).toBe('Updated');
    const list = await mgr.listCharacters();
    expect(list[0].characterName).toBe('Updated');
  });

  test('deleteCharacter removes file and index', async () => {
    const meta = await mgr.saveCharacter({ id: 'd1', name: 'Del' }, null);
    await mgr.deleteCharacter(meta.fileId);
    const list = await mgr.listCharacters();
    expect(list).toEqual([]);
  });

  test('deleteCharacter with unknown id does not throw', async () => {
    await expect(mgr.deleteCharacter('unknown')).resolves.not.toThrow();
  });
});

describe('MockGoogleDriveManager specific', () => {
  test('corrupted index string returns empty array', async () => {
    const mgr = new MockGoogleDriveManager();
    mgr.indexContent = '{';
    const res = await mgr.listCharacters();
    expect(res).toEqual([]);
  });

  test('index has entry but file missing returns null', async () => {
    const mgr = new MockGoogleDriveManager();
    await mgr._writeIndexFile([{ id: 'x', name: 'x.json', characterName: 'X', updatedAt: 't' }]);
    const res = await mgr.getCharacter('x');
    expect(res).toBeNull();
  });
});
