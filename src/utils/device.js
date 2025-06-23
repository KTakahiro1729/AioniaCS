export function isDesktopDevice() {
  return !('ontouchstart' in window || navigator.maxTouchPoints > 0);
}
