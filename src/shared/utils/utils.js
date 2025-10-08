export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function createWeaknessArray(max) {
  return Array(max)
    .fill(null)
    .map(() => ({ text: '', acquired: '--' }));
}
