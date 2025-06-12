import { useNotificationStore } from "../stores/notificationStore.js";

export function useNotifications() {
  const store = useNotificationStore();

  function showToast(options) {
    store.addToast(options);
  }

  function showModal(options) {
    return store.showModal(options);
  }

  return { showToast, showModal };
}
