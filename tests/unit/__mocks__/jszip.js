// tests/unit/__mocks__/jszip.js

import { vi } from 'vitest';

// JSZipコンストラクタのモック実装
const JSZip = vi.fn().mockImplementation(() => ({
  file: vi.fn(),
  folder: vi.fn().mockReturnThis(), // method chainingを可能にする
  generateAsync: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

// 静的メソッド loadAsync のモック実装
JSZip.loadAsync = vi.fn();

export default JSZip;
