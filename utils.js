// Utility functions

/**
 * Normalize array to a specified length.
 * Copies existing items up to target length and
 * fills missing slots with clones of the template object.
 * @param {Array} list - source array
 * @param {number} targetLength - desired length of returned array
 * @param {Object} template - template object for filling
 * @returns {Array}
 */
function normalizeList(list, targetLength, template) {
  const result = [];
  if (Array.isArray(list)) {
    for (let i = 0; i < Math.min(list.length, targetLength); i++) {
      result.push(JSON.parse(JSON.stringify(list[i])));
    }
  }
  while (result.length < targetLength) {
    result.push(JSON.parse(JSON.stringify(template)));
  }
  return result;
}

// expose globally
window.normalizeList = normalizeList;
