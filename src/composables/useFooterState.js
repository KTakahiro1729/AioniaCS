export function getFooterState(isSignedIn, defaultSaveToCloud) {
  if (!isSignedIn) {
    return {
      saveMain: "localSave",
      saveAlt: null,
      loadMain: "localLoad",
      loadAlt: null,
    };
  }
  if (defaultSaveToCloud) {
    return {
      saveMain: "cloudSave",
      saveAlt: "localSave",
      loadMain: "localLoad",
      loadAlt: null,
    };
  }
  return {
    saveMain: "localSave",
    saveAlt: "cloudSave",
    loadMain: "localLoad",
    loadAlt: null,
  };
}

import { computed } from "vue";
import { useUiStore } from "../stores/uiStore.js";

export function useFooterState() {
  const uiStore = useUiStore();
  const config = computed(() =>
    getFooterState(uiStore.isSignedIn, uiStore.defaultSaveToCloud),
  );
  const canOperateDrive = computed(() => uiStore.canOperateDrive);
  const isCloudSaveSuccess = computed(() => uiStore.isCloudSaveSuccess);
  return { config, canOperateDrive, isCloudSaveSuccess };
}
