import { arrayBufferToBase64, base64ToArrayBuffer } from '../libs/sabalessshare/src/crypto.js';

export class DriveStorageAdapter {
  constructor(dataManager) {
    this.dm = dataManager;
  }

  async create(data) {
    const content = this._serializeData(data);
    const res = await this.dm.saveFile('appDataFolder', `sls_${Date.now()}.json`, content);
    return res && res.id ? res.id : null;
  }

  async read(id) {
    const text = await this.dm.loadFileContent(id);
    if (!text) return null;
    return this._deserializeData(text);
  }

  async update(id, data) {
    const content = this._serializeData(data);
    await this.dm.saveFile('appDataFolder', `sls_${Date.now()}.json`, content, id);
  }

  _serializeData(data) {
    if (data && data.ciphertext && data.iv) {
      return JSON.stringify({
        ciphertext: arrayBufferToBase64(data.ciphertext),
        iv: arrayBufferToBase64(data.iv),
      });
    }
    const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
    return arrayBufferToBase64(buffer.buffer);
  }

  _deserializeData(text) {
    try {
      const obj = JSON.parse(text);
      if (obj.ciphertext) {
        return {
          ciphertext: base64ToArrayBuffer(obj.ciphertext),
          iv: new Uint8Array(base64ToArrayBuffer(obj.iv)),
        };
      }
    } catch {
      // not JSON
    }
    return base64ToArrayBuffer(text.trim());
  }
}
