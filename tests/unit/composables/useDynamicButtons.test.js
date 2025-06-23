import { setActivePinia, createPinia } from 'pinia';
import { useDynamicButtons } from '../../../src/composables/useDynamicButtons.js';
import { useUiStore } from '../../../src/stores/uiStore.js';
import { messages } from '../../../src/locales/ja.js';

describe('useDynamicButtons', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('local labels when signed out', () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    const { saveButton, loadButton } = useDynamicButtons();
    expect(saveButton.value.label).toBe(messages.ui.buttons.saveLocal);
    expect(loadButton.value.label).toBe(messages.ui.buttons.loadLocal);
  });

  test('new save label when no file id', () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.currentDriveFileId = null;
    const { saveButton } = useDynamicButtons();
    expect(saveButton.value.label).toBe(messages.ui.buttons.saveCloudNew);
  });

  test('overwrite label when file exists', () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.currentDriveFileId = '1';
    const { saveButton } = useDynamicButtons();
    expect(saveButton.value.label).toBe(messages.ui.buttons.saveCloudOverwrite);
  });

  test('load button uses drive when signed in', () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const { loadButton } = useDynamicButtons();
    expect(loadButton.value.label).toBe(messages.ui.buttons.loadCloud);
  });
});
