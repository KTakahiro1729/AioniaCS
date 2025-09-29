const FUNCTION_BASE_PATH = '/api/get-character-image';
const ABSOLUTE_URL_PATTERN = /^(?:https?:)?\/\//i;

function isFunctionUrl(value) {
  return typeof value === 'string' && value.startsWith(FUNCTION_BASE_PATH);
}

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

export function buildCharacterImageUrl(key) {
  if (!key) {
    return '';
  }

  if (isDataUrl(key) || ABSOLUTE_URL_PATTERN.test(key) || isFunctionUrl(key)) {
    return key;
  }

  return `${FUNCTION_BASE_PATH}?key=${encodeURIComponent(key)}`;
}

function decodePath(pathname = '') {
  const trimmed = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  try {
    return decodeURIComponent(trimmed);
  } catch (error) {
    console.warn('Failed to decode image path:', error);
    return trimmed;
  }
}

function toUrl(value) {
  try {
    return new URL(value, 'http://localhost');
  } catch (error) {
    console.warn('Failed to parse image URL:', error);
    return null;
  }
}

export function extractCharacterImageKey(reference) {
  if (!reference) {
    return '';
  }

  if (isDataUrl(reference)) {
    return '';
  }

  if (!isFunctionUrl(reference) && ABSOLUTE_URL_PATTERN.test(reference)) {
    const url = toUrl(reference);
    if (!url) {
      return '';
    }
    return decodePath(url.pathname);
  }

  if (isFunctionUrl(reference) || reference.startsWith(FUNCTION_BASE_PATH)) {
    const url = toUrl(reference);
    if (!url) {
      return '';
    }
    const key = url.searchParams.get('key');
    return key ? decodePath(key) : '';
  }

  return reference;
}
