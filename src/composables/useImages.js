(function (global) {
  function useImages() {
    return global.ImageManager;
  }
  global.useImages = useImages;
})(typeof window !== "undefined" ? window : globalThis);
