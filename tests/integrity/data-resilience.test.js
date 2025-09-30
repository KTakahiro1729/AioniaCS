import { describe, it, beforeEach, expect } from 'vitest';
import { DataManager } from '../../src/services/dataManager.js';
import { MockGoogleDriveManager } from '../../src/services/mockGoogleDriveManager.js';
import { AioniaGameData } from '../../src/data/gameData.js';

describe('DataManager data resilience', () => {
  let dm;
  let gdm;

  beforeEach(() => {
    gdm = new MockGoogleDriveManager('k', 'c');
    dm = new DataManager(AioniaGameData);
    dm.setGoogleDriveManager(gdm);
  });

  it('returns empty list when no files exist', async () => {
    const list = await dm.loadCharacterListFromDrive();
    expect(list).toEqual([]);
  });

  it('returns file metadata for stored characters', async () => {
    const folderId = await gdm.ensureAppFolder();
    const file = await gdm.saveFile(folderId, 'Hero.json', JSON.stringify({ character: { name: 'Hero' } }));

    const list = await dm.loadCharacterListFromDrive();

    expect(list).toEqual([
      {
        id: file.id,
        characterName: 'Hero',
        updatedAt: expect.any(String),
      },
    ]);
  });
});
