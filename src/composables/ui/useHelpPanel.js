import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

export function useHelpPanel() {
  const helpState = ref('closed');
  const helpIcon = ref(null);
  const helpPanel = ref(null);
  const isDesktop = ref(false);
  const isHelpVisible = computed(() => helpState.value !== 'closed');

  const handleHelpIconMouseOver = () => {
    if (isDesktop.value && helpState.value === 'closed') {
      helpState.value = 'hovered';
    }
  };

  const handleHelpIconMouseLeave = () => {
    if (isDesktop.value && helpState.value === 'hovered') {
      helpState.value = 'closed';
    }
  };

  const handleHelpIconClick = () => {
    if (isDesktop.value) {
      helpState.value = helpState.value === 'fixed' ? 'closed' : 'fixed';
    } else {
      helpState.value = helpState.value === 'closed' ? 'fixed' : 'closed';
    }
  };

  const closeHelpPanel = () => {
    helpState.value = 'closed';
  };

  let helpPanelClickListener = null;
  onMounted(() => {
    isDesktop.value = !('ontouchstart' in window || navigator.maxTouchPoints > 0);
    helpPanelClickListener = (event) => {
      if (helpState.value === 'fixed') {
        const helpPanelEl = helpPanel.value;
        const helpIconEl = helpIcon.value;
        if (helpPanelEl && helpIconEl && !helpPanelEl.contains(event.target) && !helpIconEl.contains(event.target)) {
          helpState.value = 'closed';
        }
      }
    };
    document.addEventListener('click', helpPanelClickListener);
  });

  onBeforeUnmount(() => {
    if (helpPanelClickListener) {
      document.removeEventListener('click', helpPanelClickListener);
    }
  });

  return {
    helpState,
    helpIcon,
    helpPanel,
    isHelpVisible,
    handleHelpIconMouseOver,
    handleHelpIconMouseLeave,
    handleHelpIconClick,
    closeHelpPanel,
  };
}
