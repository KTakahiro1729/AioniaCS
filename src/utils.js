(function (global) {
  function deepClone(obj) {
    if (typeof structuredClone === "function") {
      try {
        return structuredClone(obj);
      } catch (e) {
        console.error(e);
        // fallback below
      }
    }
    return JSON.parse(JSON.stringify(obj));
  }

  function createWeaknessArray(max) {
    return Array(max)
      .fill(null)
      .map(() => ({ text: "", acquired: "--" }));
  }

  function dataURLToBlob(dataURL) {
    const parts = dataURL.split(",");
    const mimeMatch = parts[0].match(/data:(.*);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "";
    const base64 = parts[1];
    if (typeof atob === "function") {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    }
    const buffer = Buffer.from(base64, "base64");
    return new Blob([buffer], { type: mime });
  }

  global.deepClone = deepClone;
  global.createWeaknessArray = createWeaknessArray;
  global.dataURLToBlob = dataURLToBlob;
})(typeof window !== "undefined" ? window : globalThis);
