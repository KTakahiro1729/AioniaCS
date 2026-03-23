import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

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
});
