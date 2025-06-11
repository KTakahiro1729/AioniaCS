import * as nodeCrypto from "node:crypto";

const cryptoObj =
  globalThis.crypto && globalThis.crypto.subtle
    ? globalThis.crypto
    : nodeCrypto.webcrypto;

export async function generateShareKey() {
  return cryptoObj.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function exportKeyToString(key) {
  const raw = await cryptoObj.subtle.exportKey("raw", key);
  return Buffer.from(raw).toString("base64");
}

export async function importKeyFromString(keyString) {
  const raw = Buffer.from(keyString, "base64");
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
