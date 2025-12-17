import { deepClone } from '@/shared/utils/utils.js';

const dataUrlPattern = /^data:image\//i;

function stripDataUrls(target) {
  if (!target || typeof target !== 'object') {
    return;
  }
  if (Array.isArray(target)) {
    target.forEach((value, index) => {
      if (typeof value === 'string' && dataUrlPattern.test(value)) {
        target[index] = '';
      } else if (value && typeof value === 'object') {
        stripDataUrls(value);
      }
    });
    return;
  }
  Object.entries(target).forEach(([key, value]) => {
    if (typeof value === 'string' && dataUrlPattern.test(value)) {
      target[key] = '';
    } else if (value && typeof value === 'object') {
      stripDataUrls(value);
    }
  });
}

export function removeImagesFromData(characterData) {
  if (!characterData || typeof characterData !== 'object') {
    return characterData;
  }
  const sanitized = characterData;
  if (sanitized.character && typeof sanitized.character === 'object') {
    if (Array.isArray(sanitized.character.images)) {
      sanitized.character.images = [];
    }
    if ('image' in sanitized.character) {
      sanitized.character.image = null;
    }
  }
  stripDataUrls(sanitized);
  return sanitized;
}

function stripCharacterId(data) {
  const cloned = deepClone(data || {});
  if (cloned.character && typeof cloned.character === 'object') {
    delete cloned.character.id;
  }
  return cloned;
}

export function hasSignificantChange(currentData, defaultData) {
  const current = stripCharacterId(currentData);
  const baseline = stripCharacterId(defaultData);
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
