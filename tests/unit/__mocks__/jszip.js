// tests/unit/__mocks__/jszip.js

import { vi } from 'vitest';

// JSZipコンストラクタのモック実装
const JSZip = vi.fn().mockImplementation(() => ({
  file: vi.fn(),
  folder: vi.fn().mockReturnValue({ file: vi.fn() }),
  generateAsync: vi.fn().mockResolvedValue(new Uint8Array([0x01, 0x02])),
}));

// 静的メソッド loadAsync のモック実装
JSZip.loadAsync = vi.fn();

export default JSZip;
