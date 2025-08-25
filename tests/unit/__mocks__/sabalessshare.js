export function createShareLink() {
  return Promise.resolve('mock-link');
}

export function receiveSharedData() {
  return Promise.resolve(new ArrayBuffer(0));
}

export function createDynamicLink() {
  return Promise.resolve({ shareLink: 'dynamic-link' });
}

export function receiveDynamicData() {
  return Promise.resolve(new ArrayBuffer(0));
}

export function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

export function base64ToArrayBuffer(str) {
  return Uint8Array.from(Buffer.from(str, 'base64')).buffer;
}
