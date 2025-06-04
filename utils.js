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

  function createWeaknessArray(max) {
    return Array(max)
      .fill(null)
      .map(() => ({ text: '', acquired: '--' }));
  }

  global.deepClone = deepClone;
  global.createWeaknessArray = createWeaknessArray;
})(typeof window !== 'undefined' ? window : globalThis);
