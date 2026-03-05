import { onMounted, onUnmounted } from 'vue';

export function useHeaderVisibility(targetRef) {
  let lastScrollY = 0;
  let currentTranslateY = 0;
  let headerHeight = 0;

  function handleScroll() {
    requestAnimationFrame(() => {
      // 現在のスクロール位置を取得
      let y = window.scrollY;

      // ページの最大スクロール可能量を計算
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      // Safariのラバーバンド対策: スクロール位置を 0 〜 maxScroll の範囲に制限
      y = Math.max(0, Math.min(y, maxScroll));

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
      targetRef.value.style.transform = 'translateY(0px)';
    }
    // 初期化時も同様に範囲内に収める
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    lastScrollY = Math.max(0, Math.min(window.scrollY, maxScroll));

    window.addEventListener('scroll', handleScroll, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });
}
