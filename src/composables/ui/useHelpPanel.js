import { ref, computed, onMounted, onBeforeUnmount } from "vue";

export function useHelpPanel(helpIcon, helpPanel) {
  const helpState = ref("closed");
  const isDesktop = ref(false);
  const isHelpVisible = computed(() => helpState.value !== "closed");

  const handleMouseOver = () => {
    if (isDesktop.value && helpState.value === "closed") {
      helpState.value = "hovered";
    }
  };

  const handleMouseLeave = () => {
    if (isDesktop.value && helpState.value === "hovered") {
      helpState.value = "closed";
    }
  };

  const handleClick = () => {
    if (isDesktop.value) {
      helpState.value = helpState.value === "fixed" ? "closed" : "fixed";
    } else {
      helpState.value = helpState.value === "closed" ? "fixed" : "closed";
    }
  };

  const closePanel = () => {
    helpState.value = "closed";
  };

  let clickListener = null;
  onMounted(() => {
    isDesktop.value = !(
      "ontouchstart" in window || navigator.maxTouchPoints > 0
    );
    clickListener = (event) => {
      if (helpState.value === "fixed") {
        const panel = helpPanel.value;
        const icon = helpIcon.value;
        if (
          panel &&
          icon &&
          !panel.contains(event.target) &&
          !icon.contains(event.target)
        ) {
          helpState.value = "closed";
        }
      }
    };
    document.addEventListener("click", clickListener);
  });

  onBeforeUnmount(() => {
    if (clickListener) document.removeEventListener("click", clickListener);
  });

  return {
    helpState,
    isDesktop,
    isHelpVisible,
    handleMouseOver,
    handleMouseLeave,
    handleClick,
    closePanel,
  };
}
