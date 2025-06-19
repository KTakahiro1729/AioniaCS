(function (global) {
  const cache = new Map();

  function getKey(name, version) {
    return `${name}-${version}`;
  }

  function invalidate(name, keepKey) {
    for (const [key, url] of cache.entries()) {
      if (key.startsWith(`${name}-`) && key !== keepKey) {
        URL.revokeObjectURL(url);
        cache.delete(key);
      }
    }
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
      const maxSize = 10 * 1024 * 1024;
      if (!file) {
        reject(new Error("No file provided."));
        return;
      }
      if (!allowed.includes(file.type)) {
        reject(
          new Error(
            "Unsupported file type. Please upload JPEG, PNG, GIF, or WebP images.",
          ),
        );
        return;
      }
      if (file.size > maxSize) {
        reject(new Error("File is too large. Maximum size is 10MB."));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const version = file.lastModified || Date.now();
        const key = getKey(file.name, version);
        const url = URL.createObjectURL(file);
        invalidate(file.name, key);
        cache.set(key, url);
        resolve({ dataUrl: e.target.result, key });
      };
      reader.onerror = () => {
        reject(new Error("Error reading file."));
      };
      reader.readAsDataURL(file);
    });
  }

  function registerDataUrl(dataUrl) {
    const key = getKey("loaded", Date.now());
    const blob = global.dataURLToBlob ? global.dataURLToBlob(dataUrl) : null;
    const url = blob ? URL.createObjectURL(blob) : dataUrl;
    if (blob) cache.set(key, url);
    return { dataUrl, key };
  }

  function getUrl(key) {
    return cache.get(key) || null;
  }

  function revoke(key) {
    const url = cache.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      cache.delete(key);
    }
  }

  function clear() {
    for (const k of Array.from(cache.keys())) {
      revoke(k);
    }
  }

  global.ImageManager = {
    loadImage,
    registerDataUrl,
    getUrl,
    revoke,
    clear,
  };
})(typeof window !== "undefined" ? window : globalThis);
