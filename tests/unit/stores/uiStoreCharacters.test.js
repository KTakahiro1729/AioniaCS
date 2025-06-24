import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('uiStore character cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('refreshDriveCharacters loads list via dataManager', async () => {
    const store = useUiStore();
    const dm = {
      loadCharacterListFromDrive: vi.fn().mockResolvedValue([{ fileId: '1', characterName: 'A', lastModified: 't' }]),
    };
    await store.refreshDriveCharacters(dm);
    expect(dm.loadCharacterListFromDrive).toHaveBeenCalled();
    expect(store.driveCharacters).toEqual([{ fileId: '1', characterName: 'A', lastModified: 't' }]);
  });

  test('clearDriveCharacters empties cache', () => {
    const store = useUiStore();
    store.driveCharacters = [{ fileId: '1' }];
    store.clearDriveCharacters();
    expect(store.driveCharacters).toEqual([]);
  });

  test('drive character add, update, remove', () => {
    const store = useUiStore();
    store.addDriveCharacter({ fileId: 'a', name: 'a.json', characterName: 'A' });
    expect(store.driveCharacters).toHaveLength(1);
    store.updateDriveCharacter('a', { characterName: 'B' });
    expect(store.driveCharacters[0].characterName).toBe('B');
    store.removeDriveCharacter('a');
    expect(store.driveCharacters).toHaveLength(0);
  });

  test('pending drive save lifecycle', () => {
    const store = useUiStore();
    const token = store.registerPendingDriveSave('temp-1');
    expect(store.pendingDriveSaves['temp-1']).toBe(token);
    store.cancelPendingDriveSave('temp-1');
    expect(token.canceled).toBe(true);
    store.completePendingDriveSave('temp-1');
    expect(store.pendingDriveSaves['temp-1']).toBeUndefined();
  });
});
