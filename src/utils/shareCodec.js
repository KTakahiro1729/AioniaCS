function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(bytes) {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const padded = str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(str.length / 4) * 4, '=');
  return fromBase64(padded);
}

export function arrayBufferToBase64(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  return toBase64(bytes);
}

export function base64ToArrayBuffer(str) {
  return fromBase64(str).buffer;
}

export function parseShareUrl(location) {
  const params = new URLSearchParams(location.search);
  if (params.has('did')) return { mode: 'dynamic', id: params.get('did') };
  if (params.has('sid')) return { mode: 'cloud', id: params.get('sid') };
  if (params.has('sd')) return { mode: 'simple', data: params.get('sd') };
  return null;
}

export async function createDynamicLink({ data, adapter }) {
  const id = await adapter.create(new Uint8Array(data));
  const shareLink = `${window.location.origin}${window.location.pathname}?did=${encodeURIComponent(id)}`;
  return { shareLink };
}

export async function receiveDynamicData({ location, adapter }) {
  const params = parseShareUrl(location);
  if (!params || params.mode !== 'dynamic' || !params.id) {
    const err = new Error('invalid dynamic link');
    err.name = 'InvalidLinkError';
    throw err;
  }
  const data = await adapter.read(params.id);
  if (!data) {
    const err = new Error('shared data not found');
    err.name = 'InvalidLinkError';
    throw err;
  }
  if (data.ciphertext) return data.ciphertext;
  return data;
}

export async function createShareLink({ data, mode, uploadHandler, shortenUrlHandler }) {
  if (mode === 'cloud') {
    const id = await uploadHandler({ ciphertext: data, iv: new Uint8Array(12) });
    const longUrl = `${window.location.origin}${window.location.pathname}?sid=${encodeURIComponent(id)}`;
    return shortenUrlHandler ? shortenUrlHandler(longUrl) : longUrl;
  }
  const raw = data instanceof Uint8Array ? data : new Uint8Array(data);
  const encoded = toBase64Url(raw);
  const longUrl = `${window.location.origin}${window.location.pathname}?sd=${encoded}`;
  return shortenUrlHandler ? shortenUrlHandler(longUrl) : longUrl;
}

export async function receiveSharedData({ location, downloadHandler }) {
  const params = parseShareUrl(location);
  if (!params || !params.mode) {
    const err = new Error('invalid share link');
    err.name = 'InvalidLinkError';
    throw err;
  }

  if (params.mode === 'simple') {
    if (!params.data) {
      const err = new Error('missing data');
      err.name = 'InvalidLinkError';
      throw err;
    }
    return fromBase64Url(params.data).buffer;
  }

  if (params.mode === 'cloud') {
    if (!params.id) {
      const err = new Error('missing file id');
      err.name = 'InvalidLinkError';
      throw err;
    }
    const encrypted = await downloadHandler(params.id);
    return encrypted.ciphertext;
  }

  const err = new Error('unsupported mode');
  err.name = 'InvalidLinkError';
  throw err;
}
