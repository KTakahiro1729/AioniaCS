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

  it('should skip files that cannot be parsed', async () => {
    await gdm.saveFile(null, 'Corrupt.json', 'not-json');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const list = await dm.loadCharacterListFromDrive();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should include valid files stored in Drive folder', async () => {
    await gdm.saveFile(
      null,
      'Hero.json',
      JSON.stringify({
        character: { name: 'Hero' },
        skills: [],
        specialSkills: [],
        equipments: {},
        histories: [],
      }),
    );
    const list = await dm.loadCharacterListFromDrive();
    expect(list).toEqual([expect.objectContaining({ id: expect.any(String), characterName: 'Hero' })]);
  });
});
