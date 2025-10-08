import { computed } from 'vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { messages } from '@/locales/ja.js';

export function useDynamicButtons() {
  const uiStore = useUiStore();

  const saveButton = computed(() => {
    if (!uiStore.isSignedIn) {
      return {
        label: messages.ui.buttons.saveLocal,
        title: messages.ui.buttons.saveLocalTitle,
        icon: 'icon-svg-local-download',
      };
    }
    if (!uiStore.currentDriveFileId) {
      return {
        label: messages.ui.buttons.saveCloudNew,
        title: messages.ui.buttons.saveCloudTitle,
        icon: 'icon-svg-cloud-upload',
      };
    }
    return {
      label: messages.ui.buttons.saveCloudOverwrite,
      title: messages.ui.buttons.saveCloudTitle,
      icon: 'icon-svg-cloud-upload',
    };
  });

  const loadButton = computed(() => {
    return uiStore.isSignedIn
      ? {
          label: messages.ui.buttons.loadCloud,
          title: messages.ui.buttons.loadCloudTitle,
          icon: 'icon-svg-cloud-download',
        }
      : {
          label: messages.ui.buttons.loadLocal,
          title: messages.ui.buttons.loadLocalTitle,
          icon: 'icon-svg-local-upload',
        };
  });

  return { saveButton, loadButton };
}
