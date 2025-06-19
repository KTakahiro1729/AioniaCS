import { computed } from "vue";
import { useUiStore } from "../stores/uiStore.js";
import { messages } from "../locales/ja.js";

export function useDynamicButtons() {
  const uiStore = useUiStore();

  const saveButton = computed(() => {
    return uiStore.isSignedIn
      ? {
          label: messages.ui.buttons.saveCloud,
          title: messages.ui.buttons.saveCloudTitle,
          icon: "icon-svg-cloud-upload",
        }
      : {
          label: messages.ui.buttons.saveLocal,
          title: messages.ui.buttons.saveLocalTitle,
          icon: "icon-svg-local-download",
        };
  });

  const loadButton = computed(() => {
    return uiStore.isSignedIn
      ? {
          label: messages.ui.buttons.loadCloud,
          title: messages.ui.buttons.loadCloudTitle,
          icon: "icon-svg-cloud-download",
        }
      : {
          label: messages.ui.buttons.loadLocal,
          title: messages.ui.buttons.loadLocalTitle,
          icon: "icon-svg-local-upload",
        };
  });

  return { saveButton, loadButton };
}
