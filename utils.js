// Utility functions for Aionia CS
function createWeaknessArray(max) {
  return Array(max).fill(null).map(() => ({ text: '', acquired: '--' }));
}

// expose globally
window.createWeaknessArray = createWeaknessArray;
