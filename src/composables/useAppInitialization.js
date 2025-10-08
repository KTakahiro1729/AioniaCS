import { useUiStore } from '../stores/uiStore.js';

export function useAppInitialization() {
  const uiStore = useUiStore();

  async function initialize() {
    uiStore.setLoading(false);
    uiStore.isViewingShared = false;
  }

  return { initialize };
}
