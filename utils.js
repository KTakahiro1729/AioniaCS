(function(global) {
  function deepClone(obj) {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(obj);
      } catch (e) {
        // fallback below
      }
    }
    return JSON.parse(JSON.stringify(obj));
  }

  global.deepClone = deepClone;
})(typeof window !== 'undefined' ? window : globalThis);
