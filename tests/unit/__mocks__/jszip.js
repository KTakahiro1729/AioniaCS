// tests/unit/__mocks__/jszip.js

import { jest } from "@jest/globals";

// JSZipコンストラクタのモック実装
const JSZip = jest.fn().mockImplementation(() => ({
  file: jest.fn(),
  folder: jest.fn().mockReturnThis(), // method chainingを可能にする
  generateAsync: jest.fn().mockResolvedValue(new Blob(["zip_blob_content"])),
}));

// 静的メソッド loadAsync のモック実装
JSZip.loadAsync = jest.fn();

export default JSZip;
