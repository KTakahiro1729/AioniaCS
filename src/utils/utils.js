(function (global) {
  /**
   * Performs a deep clone of a JSON-compatible object.
   * @param {any} obj The object to clone.
   * @returns {any} A deep copy of the object.
   */
  function deepClone(obj) {
    // structuredCloneで発生するブラウザ間の互換性問題を避けるため、
    // アプリケーションのデータ構造に対して十分堅牢なJSONメソッドのみを使用します。
    return JSON.parse(JSON.stringify(obj));
  }

  function createWeaknessArray(max) {
    return Array(max)
      .fill(null)
      .map(() => ({ text: "", acquired: "--" }));
  }

  global.deepClone = deepClone;
  global.createWeaknessArray = createWeaknessArray;
})(typeof window !== "undefined" ? window : globalThis);
