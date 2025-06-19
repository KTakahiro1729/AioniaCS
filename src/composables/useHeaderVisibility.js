import { onMounted, onBeforeUnmount } from "vue";
import { useUiStore } from "../stores/uiStore.js";

export function useHeaderVisibility() {
  const uiStore = useUiStore();
  let lastScroll = 0;

  function handleScroll() {
    const y = window.scrollY;
    if (y > lastScroll && y > 50) {
      uiStore.showHeader = false;
    } else if (y < lastScroll) {
      uiStore.showHeader = true;
    }
    lastScroll = y;
  }

  onMounted(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", handleScroll);
  });
}
