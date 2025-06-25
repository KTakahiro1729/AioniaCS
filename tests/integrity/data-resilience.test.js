import { describe, it, beforeEach, vi, expect } from 'vitest';
import { DataManager } from '../../src/services/dataManager.js';
import { MockGoogleDriveManager } from '../../src/services/mockGoogleDriveManager.js';
import { AioniaGameData } from '../../src/data/gameData.js';

describe('DataManager data integrity', () => {
  let dm;
  let gdm;

  beforeEach(() => {
    gdm = new MockGoogleDriveManager('k', 'c');
    dm = new DataManager(AioniaGameData);
    dm.setGoogleDriveManager(gdm);
  });

  it('should handle corrupted pointers gracefully without crashing', async () => {
    await gdm.writeIndexFile([{ id: 'missing', characterName: 'Missing' }]);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const list = await dm.loadCharacterListFromDrive();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should ignore orphaned files not referenced in index', async () => {
    const file = await gdm.createCharacterFile({ character: { name: 'Orphan' } });
    await gdm.writeIndexFile([]);
    const list = await dm.loadCharacterListFromDrive();
    expect(list).toEqual([]);
    // ensure file exists but ignored
    expect(gdm.appData[file.id]).toBeDefined();
  });
});
