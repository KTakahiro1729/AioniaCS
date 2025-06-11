import {
  generateShareKey,
  exportKeyToString,
  importKeyFromString,
  encryptData,
  decryptData,
} from "../../../src/utils/crypto.js";

describe("crypto utilities", () => {
  test("key generation, export and import", async () => {
    const key = await generateShareKey();
    const exported = await exportKeyToString(key);
    const imported = await importKeyFromString(exported);
    const exportedAgain = await exportKeyToString(imported);
    expect(exportedAgain).toBe(exported);
  });

  test("encrypt and decrypt round trip", async () => {
    const key = await generateShareKey();
    const data = Buffer.from("hello world");
    const payload = await encryptData(key, data);
    const decrypted = await decryptData(key, payload);
    expect(Buffer.from(decrypted).toString()).toBe("hello world");
  });

  test("decrypt with different key fails", async () => {
    const key = await generateShareKey();
    const otherKey = await generateShareKey();
    const data = Buffer.from("secret");
    const payload = await encryptData(key, data);
    await expect(decryptData(otherKey, payload)).rejects.toThrow();
  });

  test("tampered ciphertext or iv fails", async () => {
    const key = await generateShareKey();
    const data = Buffer.from("secret");
    const payload = await encryptData(key, data);

    const tamperedCipher = new Uint8Array(payload.ciphertext);
    tamperedCipher[0] ^= 0xff;
    await expect(
      decryptData(key, { ciphertext: tamperedCipher, iv: payload.iv }),
    ).rejects.toThrow();

    const tamperedIv = new Uint8Array(payload.iv);
    tamperedIv[0] ^= 0xff;
    await expect(
      decryptData(key, { ciphertext: payload.ciphertext, iv: tamperedIv }),
    ).rejects.toThrow();
  });
});
