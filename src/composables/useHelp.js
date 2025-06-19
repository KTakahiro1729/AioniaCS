import { ref, computed, onMounted, onBeforeUnmount } from "vue";

export function useHelp(helpPanelRef, triggerRef) {
  const helpState = ref("closed");
  const isDesktop = ref(false);
  const isHelpVisible = computed(() => helpState.value !== "closed");

  function handleHelpIconMouseOver() {
    if (isDesktop.value && helpState.value === "closed") {
      helpState.value = "hovered";
    }
  }

  function handleHelpIconMouseLeave() {
    if (isDesktop.value && helpState.value === "hovered") {
      helpState.value = "closed";
    }
  }

  function handleHelpIconClick() {
    if (isDesktop.value) {
      helpState.value = helpState.value === "fixed" ? "closed" : "fixed";
    } else {
      helpState.value = helpState.value === "closed" ? "fixed" : "closed";
    }
  }

  function closeHelpPanel() {
    helpState.value = "closed";
  }

  function handleClickOutside(event) {
    if (helpState.value !== "fixed") return;
    const panelEl = helpPanelRef.value?.panelEl || helpPanelRef.value;
    const iconEl = triggerRef.value?.helpIcon;
    if (
      panelEl &&
      iconEl &&
      !panelEl.contains(event.target) &&
      !iconEl.contains(event.target)
    ) {
      helpState.value = "closed";
    }
  }

  onMounted(() => {
    isDesktop.value = !(
      "ontouchstart" in window || navigator.maxTouchPoints > 0
    );
    document.addEventListener("click", handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  return {
    helpState,
    isHelpVisible,
    handleHelpIconMouseOver,
    handleHelpIconMouseLeave,
    handleHelpIconClick,
    closeHelpPanel,
  };
}
