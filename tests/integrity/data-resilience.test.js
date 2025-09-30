import { describe, it, beforeEach, expect } from 'vitest';
import { DataManager } from '../../src/services/dataManager.js';
import {
  initializeMockGoogleDriveManager,
  resetMockGoogleDriveManagerForTests,
  getMockGoogleDriveManagerInstance,
} from '../../src/services/mockGoogleDriveManager.js';
import { AioniaGameData } from '../../src/data/gameData.js';

describe('DataManager data integrity', () => {
  let dm;
  let gdm;

  beforeEach(() => {
    resetMockGoogleDriveManagerForTests();
    gdm = initializeMockGoogleDriveManager('k', 'c');
    dm = new DataManager(AioniaGameData);
    dm.setGoogleDriveManager(gdm);
  });

  it('saves a new character into the .AioniaCS folder', async () => {
    const result = await dm.saveDataToAppData({ name: 'Hero' }, [], [], {}, [], null);

    expect(result?.id).toBeTruthy();
    const stored = await gdm.loadCharacterFile(result.id);
    expect(stored.character.name).toBe('Hero');
  });

  it('finds existing files by character name and updates them', async () => {
    const initial = await dm.saveDataToAppData({ name: 'Scout', memo: 'original' }, [], [], {}, [], null);

    const found = await dm.findDriveFileByCharacterName('Scout');
    expect(found?.id).toBe(initial.id);

    await dm.saveDataToAppData({ name: 'Scout', memo: 'updated' }, [], [], {}, [], found.id);

    const updated = await getMockGoogleDriveManagerInstance().loadCharacterFile(found.id);
    expect(updated.character.memo).toBe('updated');
  });
});
