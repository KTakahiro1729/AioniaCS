import { webcrypto } from 'crypto';
import { TextEncoder as UtilTextEncoder, TextDecoder as UtilTextDecoder } from 'util';

if (!global.crypto) {
  global.crypto = webcrypto;
}

// Ensure TextEncoder and TextDecoder are available
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = UtilTextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = UtilTextDecoder;
}

const localStorageMock = (function () {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
