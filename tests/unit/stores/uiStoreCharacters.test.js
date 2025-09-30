import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('uiStore drive state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('setCurrentDriveFileId updates the current id', () => {
    const store = useUiStore();
    store.setCurrentDriveFileId('file-123');
    expect(store.currentDriveFileId).toBe('file-123');
  });

  test('clearCurrentDriveFileId resets the id to null', () => {
    const store = useUiStore();
    store.setCurrentDriveFileId('file-abc');
    store.clearCurrentDriveFileId();
    expect(store.currentDriveFileId).toBeNull();
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
