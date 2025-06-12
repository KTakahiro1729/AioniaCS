import * as nodeCrypto from "node:crypto";

const cryptoObj =
  globalThis.crypto && globalThis.crypto.subtle
    ? globalThis.crypto
    : nodeCrypto.webcrypto;

function arrayBufferToBase64(buffer) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buffer).toString("base64");
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(base64, "base64");
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function generateShareKey() {
  return cryptoObj.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function exportKeyToString(key) {
  const raw = await cryptoObj.subtle.exportKey("raw", key);
  return arrayBufferToBase64(raw);
}

export async function importKeyFromString(keyString) {
  const raw = base64ToArrayBuffer(keyString);
  return cryptoObj.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptData(key, data) {
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const ciphertext = await cryptoObj.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return { ciphertext, iv };
}

export async function decryptData(key, { ciphertext, iv }) {
  return cryptoObj.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
}

export { arrayBufferToBase64, base64ToArrayBuffer };
