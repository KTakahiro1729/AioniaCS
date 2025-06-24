import { setActivePinia, createPinia } from 'pinia';
import { vi } from 'vitest';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('uiStore character cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('refreshDriveCharacters merges lists', async () => {
    const store = useUiStore();
    store.driveCharacters = [
      { id: '2', name: 'b.json' },
      { id: 'temp-1', name: 'temp.json' },
    ];
    const dm = {
      listCharacters: vi.fn().mockResolvedValue([{ fileId: '1', characterName: 'A', lastModified: 'now' }]),
    };
    await store.refreshDriveCharacters(dm);
    expect(store.driveCharacters).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: '1' }), expect.objectContaining({ id: 'temp-1', name: 'temp.json' })]),
    );
  });

  test('deleteCharacter calls dataManager and refreshes', async () => {
    const store = useUiStore();
    const dm = { deleteCharacter: vi.fn().mockResolvedValue(), listCharacters: vi.fn().mockResolvedValue([]) };
    const refreshSpy = vi.spyOn(store, 'refreshDriveCharacters');
    await store.deleteCharacter(dm, 'a');
    expect(dm.deleteCharacter).toHaveBeenCalledWith('a');
    expect(refreshSpy).toHaveBeenCalledWith(dm);
  });

  test('clearDriveCharacters empties cache', () => {
    const store = useUiStore();
    store.driveCharacters = [{ id: '1' }];
    store.clearDriveCharacters();
    expect(store.driveCharacters).toEqual([]);
  });

  test('drive character add, update, remove', () => {
    const store = useUiStore();
    store.addDriveCharacter({ id: 'a', name: 'a.json', characterName: 'A' });
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
