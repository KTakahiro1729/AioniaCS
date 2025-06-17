import { useModalStore } from "../stores/modalStore.js";

export function useModal() {
  const store = useModalStore();

  function showModal(options) {
    return store.showModal(options);
  }

  return { showModal };
}
