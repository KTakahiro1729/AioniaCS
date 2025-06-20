import { onMounted, onUnmounted } from "vue";

export function useHeaderVisibility(targetRef) {
  let lastScrollY = 0;
  let currentTranslateY = 0;
  let headerHeight = 0;

  function handleScroll() {
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const delta = y - lastScrollY;
      currentTranslateY -= delta;
      if (currentTranslateY > 0) currentTranslateY = 0;
      if (currentTranslateY < -headerHeight) currentTranslateY = -headerHeight;
      if (targetRef.value) {
        targetRef.value.style.transform = `translateY(${currentTranslateY}px)`;
      }
      lastScrollY = y;
    });
  }

  onMounted(() => {
    if (targetRef.value) {
      headerHeight = targetRef.value.offsetHeight;
      targetRef.value.style.transform = "translateY(0px)";
    }
    lastScrollY = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });
}
