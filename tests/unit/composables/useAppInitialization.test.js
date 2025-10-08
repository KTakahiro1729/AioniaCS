import { setActivePinia, createPinia } from 'pinia';
import { useAppInitialization } from '../../../src/composables/useAppInitialization.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('useAppInitialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('resets loading state and shared view flag', async () => {
    const uiStore = useUiStore();
    uiStore.setLoading(true);
    uiStore.isViewingShared = true;

    const { initialize } = useAppInitialization();
    await initialize();

    expect(uiStore.isLoading).toBe(false);
    expect(uiStore.isViewingShared).toBe(false);
  });
});
