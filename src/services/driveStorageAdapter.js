import { arrayBufferToBase64, base64ToArrayBuffer } from '../libs/sabalessshare/src/crypto.js';

const FILE_NAMES = {
  data: 'sls_dynamic_data.json',
  pointer: 'sls_dynamic_pointer.txt',
};

export class DriveStorageAdapter {
  constructor(googleDriveManager) {
    this.gdm = googleDriveManager;
  }

  async create(data) {
    this._ensureManager();
    const serialized = this._serializeData(data);
    const id = await this.gdm.uploadAndShareFile(serialized.body, FILE_NAMES[serialized.kind], serialized.mimeType);
    if (!id) {
      throw new Error('Google Drive へのアップロードに失敗しました');
    }
    return id;
  }

  async read(id) {
    this._ensureManager();
    if (!id) {
      throw new Error('読み込み対象のIDが指定されていません');
    }
    const text = await this.gdm.loadFileContent(id);
    if (!text) {
      throw new Error('Google Drive からファイルを取得できませんでした');
    }
    return this._deserializeData(text);
  }

  async update(id, data) {
    this._ensureManager();
    if (!id) {
      throw new Error('更新対象のIDが指定されていません');
    }
    const serialized = this._serializeData(data);
    const result = await this.gdm.saveFile(null, FILE_NAMES[serialized.kind], serialized.body, id, serialized.mimeType);
    if (!result || !result.id) {
      throw new Error('Google Drive の共有ファイル更新に失敗しました');
    }
  }

  _serializeData(data) {
    if (data && data.ciphertext && data.iv) {
      return {
        body: JSON.stringify({
          ciphertext: arrayBufferToBase64(data.ciphertext),
          iv: arrayBufferToBase64(data.iv),
        }),
        mimeType: 'application/json',
        kind: 'data',
      };
    }
    const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
    return {
      body: arrayBufferToBase64(buffer.buffer),
      mimeType: 'text/plain',
      kind: 'pointer',
    };
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

  _ensureManager() {
    if (!this.gdm) {
      throw new Error('Google Drive マネージャーが設定されていません');
    }
  }
}
