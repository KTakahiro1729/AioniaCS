import { describe, it, beforeEach, expect, vi } from 'vitest';
import { MockGoogleDriveManager } from '../../src/services/mockGoogleDriveManager.js';

describe('GoogleDriveManager public API', () => {
  let gdm;
  beforeEach(() => {
    gdm = new MockGoogleDriveManager('k', 'c');
  });

  describe('listCharacters', () => {
    it('returns metadata from valid index', async () => {
      const now = new Date('2024-01-01T00:00:00.000Z');
      vi.useFakeTimers().setSystemTime(now);
      const meta = await gdm.saveCharacter({ name: 'Alice' }, null);
      vi.useRealTimers();
      const list = await gdm.listCharacters();
      expect(list).toEqual([
        {
          fileId: meta.fileId,
          characterName: 'Alice',
          lastModified: now.toISOString(),
        },
      ]);
    });

    it('returns empty array when index file is missing', async () => {
      gdm.indexFileId = null;
      gdm.appData = {};
      const list = await gdm.listCharacters();
      expect(list).toEqual([]);
    });

    it('returns empty array when index content is object', async () => {
      const info = await gdm.saveFile('appDataFolder', 'character_index.json', '{}');
      gdm.indexFileId = info.id;
      const list = await gdm.listCharacters();
      expect(list).toEqual([]);
    });

    it('returns empty array and logs when JSON invalid', async () => {
      const info = await gdm.saveFile('appDataFolder', 'character_index.json', 'invalid');
      gdm.indexFileId = info.id;
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const list = await gdm.listCharacters();
      expect(list).toEqual([]);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('getCharacter', () => {
    it('returns data for existing id', async () => {
      const file = await gdm.createCharacterFile({ foo: 'bar' }, 'c.json');
      const data = await gdm.getCharacter(file.id);
      expect(data.foo).toBe('bar');
    });

    it('returns null when file missing', async () => {
      const data = await gdm.getCharacter('missing');
      expect(data).toBeNull();
    });

    it('throws when JSON is invalid', async () => {
      const file = await gdm.createCharacterFile({ foo: 'bar' }, 'c.json');
      gdm.appData[file.id].content = '{ bad json';
      await expect(gdm.getCharacter(file.id)).rejects.toThrow();
    });
  });

  describe('saveCharacter', () => {
    it('creates new character and updates index', async () => {
      const now = new Date('2024-02-01T00:00:00.000Z');
      vi.useFakeTimers().setSystemTime(now);
      const meta = await gdm.saveCharacter({ name: 'Bob' }, null);
      expect(meta.characterName).toBe('Bob');
      vi.useRealTimers();
      const list = await gdm.listCharacters();
      expect(list.find((e) => e.fileId === meta.fileId)).toBeDefined();
    });

    it('updates existing character entry', async () => {
      const file = await gdm.createCharacterFile({ name: 'Old' }, 'o.json');
      const info = await gdm.saveFile(
        'appDataFolder',
        'character_index.json',
        JSON.stringify([
          {
            id: file.id,
            name: file.name,
            characterName: 'Old',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ]),
      );
      gdm.indexFileId = info.id;
      const meta = await gdm.saveCharacter({ name: 'New' }, file.id);
      expect(meta.fileId).toBe(file.id);
      const list = await gdm.listCharacters();
      expect(list[0].characterName).toBe('New');
    });

    it('throws when index update fails after save', async () => {
      vi.spyOn(gdm, 'saveFile').mockImplementation((folder, name, content, id) => {
        if (name === 'character_index.json') {
          return Promise.reject(new Error('fail'));
        }
        return MockGoogleDriveManager.prototype.saveFile.call(gdm, folder, name, content, id);
      });
      await expect(gdm.saveCharacter({ name: 'X' }, null)).rejects.toThrow('fail');
    });
  });

  describe('deleteCharacter', () => {
    it('removes file and index', async () => {
      const meta = await gdm.saveCharacter({ name: 'C', foo: 'bar' }, null);
      await gdm.deleteCharacter(meta.fileId);
      expect(gdm.appData[meta.fileId]).toBeUndefined();
      const list = await gdm.listCharacters();
      expect(list.find((e) => e.fileId === meta.fileId)).toBeUndefined();
    });

    it('is idempotent for missing id', async () => {
      await gdm.deleteCharacter('missing');
    });
  });
});
