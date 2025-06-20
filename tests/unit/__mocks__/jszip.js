// tests/unit/__mocks__/jszip.js

import { vi } from "vitest";

// JSZipコンストラクタのモック実装
const JSZip = vi.fn().mockImplementation(() => ({
  file: vi.fn(),
  folder: vi.fn().mockReturnThis(), // method chainingを可能にする
  generateAsync: vi.fn().mockResolvedValue(new Blob(["zip_blob_content"])),
}));

// 静的メソッド loadAsync のモック実装
JSZip.loadAsync = vi.fn();

export default JSZip;
