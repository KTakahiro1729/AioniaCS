import { onMounted, onUnmounted } from 'vue';

export function useHeaderVisibility(targetRef) {
  let lastScrollY = 0;
  let currentTranslateY = 0;
  let appliedTranslateY = 0;
  let headerHeight = 0;
  let rafId = null;
  let frameRequested = false;
  let resizeObserver = null;

  function clampTranslate(delta) {
    currentTranslateY = Math.min(0, Math.max(currentTranslateY - delta, -headerHeight));
  }

  function applyTransform() {
    frameRequested = false;
    rafId = null;
    const target = targetRef.value;
    if (!target) {
      return;
    }

    const scrollY = window.scrollY;
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;
    if (!delta && currentTranslateY === appliedTranslateY) {
      return;
    }

    clampTranslate(delta);
    if (appliedTranslateY !== currentTranslateY) {
      target.style.transform = `translateY(${currentTranslateY}px)`;
      appliedTranslateY = currentTranslateY;
    }
  }

  function scheduleTransform() {
    if (frameRequested) {
      return;
    }
    frameRequested = true;
    rafId = requestAnimationFrame(applyTransform);
  }

  function observeHeaderHeight() {
    if (!targetRef.value || typeof ResizeObserver === 'undefined') {
      headerHeight = targetRef.value?.offsetHeight ?? 0;
      return;
    }

    if (resizeObserver) {
      resizeObserver.disconnect();
    }

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      headerHeight = entry.contentRect.height;
      if (currentTranslateY < -headerHeight) {
        currentTranslateY = -headerHeight;
        scheduleTransform();
      }
    });
    resizeObserver.observe(targetRef.value);
  }

  function handleScroll() {
    scheduleTransform();
  }

  onMounted(() => {
    const target = targetRef.value;
    if (target) {
      target.style.willChange = 'transform';
      target.style.transform = 'translateY(0px)';
    }
    observeHeaderHeight();
    lastScrollY = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    frameRequested = false;
  });
}
