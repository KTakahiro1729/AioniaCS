const SCRIPT_CONFIGS = [
  {
    src: 'https://accounts.google.com/gsi/client',
    check: () => typeof window !== 'undefined' && window.google && window.google.accounts,
  },
  {
    src: 'https://apis.google.com/js/api.js',
    check: () => typeof window !== 'undefined' && window.gapi && typeof window.gapi.load === 'function',
  },
];

const scriptPromises = new Map();
let combinedLoadPromise = null;

function loadScript({ src, check }) {
  if (check()) {
    return Promise.resolve();
  }

  if (scriptPromises.has(src)) {
    return scriptPromises.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    const target = existing || document.createElement('script');

    const cleanup = () => {
      target.removeEventListener('load', handleLoad);
      target.removeEventListener('error', handleError);
    };

    const handleLoad = () => {
      target.dataset.loaded = 'true';
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error(`Failed to load script: ${src}`));
    };

    if (!existing) {
      target.src = src;
      target.async = true;
      target.defer = true;
      target.addEventListener('load', handleLoad, { once: true });
      target.addEventListener('error', handleError, { once: true });
      document.head.appendChild(target);
    } else if (existing.dataset.loaded === 'true') {
      resolve();
      return;
    } else {
      existing.addEventListener('load', handleLoad, { once: true });
      existing.addEventListener('error', handleError, { once: true });
    }
  }).finally(() => {
    scriptPromises.delete(src);
  });

  scriptPromises.set(src, promise);
  return promise;
}

export function loadGoogleDriveScripts() {
  if (combinedLoadPromise) {
    return combinedLoadPromise;
  }

  combinedLoadPromise = Promise.all(SCRIPT_CONFIGS.map((config) => loadScript(config))).then(() => undefined);
  return combinedLoadPromise;
}
