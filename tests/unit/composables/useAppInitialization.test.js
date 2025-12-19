import { setActivePinia, createPinia } from 'pinia';
import { useAppInitialization } from '@/app/providers/useAppInitialization.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

describe('useAppInitialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('sets loading state to false on initialize', async () => {
    const uiStore = useUiStore();
    uiStore.setLoading(true);
    const { initialize } = useAppInitialization();
    await initialize();
    expect(uiStore.isLoading).toBe(false);
  });

  test('leaves viewing flags untouched', async () => {
    const uiStore = useUiStore();
    uiStore.isViewingShared = true;
    const { initialize } = useAppInitialization();
    await initialize();
    expect(uiStore.isViewingShared).toBe(true);
  });
});
