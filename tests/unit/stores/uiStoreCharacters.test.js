import { setActivePinia, createPinia } from 'pinia';
import { vi } from 'vitest';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('uiStore character cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('refreshCloudCharacters merges lists', async () => {
    const store = useUiStore();
    store.cloudCharacters = [
      { id: '2', characterName: 'B' },
      { id: 'temp-1', characterName: 'Temp' },
    ];
    const dataManager = { loadCharacterListFromCloud: vi.fn().mockResolvedValue([{ id: '1' }]) };
    await store.refreshCloudCharacters(dataManager);
    expect(store.cloudCharacters).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: '1' }), expect.objectContaining({ id: 'temp-1', characterName: 'Temp' })]),
    );
  });

  test('clearCloudCharacters empties cache', () => {
    const store = useUiStore();
    store.cloudCharacters = [{ id: '1' }];
    store.clearCloudCharacters();
    expect(store.cloudCharacters).toEqual([]);
  });

  test('cloud character add, update, remove', () => {
    const store = useUiStore();
    store.addCloudCharacter({ id: 'a', characterName: 'A' });
    expect(store.cloudCharacters).toHaveLength(1);
    store.updateCloudCharacter('a', { characterName: 'B' });
    expect(store.cloudCharacters[0].characterName).toBe('B');
    store.removeCloudCharacter('a');
    expect(store.cloudCharacters).toHaveLength(0);
  });

  test('pending cloud save lifecycle', () => {
    const store = useUiStore();
    const token = store.registerPendingCloudSave('temp-1');
    expect(store.pendingCloudSaves['temp-1']).toBe(token);
    store.cancelPendingCloudSave('temp-1');
    expect(token.canceled).toBe(true);
    store.completePendingCloudSave('temp-1');
    expect(store.pendingCloudSaves['temp-1']).toBeUndefined();
  });
});
