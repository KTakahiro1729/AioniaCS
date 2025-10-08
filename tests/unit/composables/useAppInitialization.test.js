import { setActivePinia, createPinia } from 'pinia';
import { useAppInitialization } from '../../../src/composables/useAppInitialization.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('useAppInitialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('clears loading state', async () => {
    const uiStore = useUiStore();
    uiStore.setLoading(true);
    const { initialize } = useAppInitialization();
    await initialize();
    expect(uiStore.isLoading).toBe(false);
  });
});
