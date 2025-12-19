import { describe, expect, vi, beforeEach, afterEach, test } from 'vitest';
import { ImageManager } from '@/features/character-sheet/services/imageManager.js';

describe('ImageManager thumbnail generation', () => {
  let originalImage;
  let originalDocument;
  let canvasMock;

  beforeEach(() => {
    originalImage = global.Image;
    originalDocument = global.document;

    class FakeImage {
      constructor() {
        this.width = 800;
        this.height = 400;
        this.onload = null;
        this.onerror = null;
      }

      set src(value) {
        this._src = value;
        if (this.onload) {
          this.onload();
        }
      }
    }

    canvasMock = {
      width: 0,
      height: 0,
      ctx: {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
      },
      getContext: vi.fn(function () {
        return this.ctx;
      }),
      toDataURL: vi.fn(() => 'data:image/png;base64,fake'),
    };

    global.Image = FakeImage;
    global.document = {
      createElement: vi.fn(() => canvasMock),
    };
  });

  afterEach(() => {
    global.Image = originalImage;
    global.document = originalDocument;
  });

  test('createThumbnailFromDataUrl resizes and centers within 256px square', async () => {
    const dataUrl = 'data:image/png;base64,aaaa';
    const result = await ImageManager.createThumbnailFromDataUrl(dataUrl);

    expect(canvasMock.width).toBe(256);
    expect(canvasMock.height).toBe(256);
    expect(canvasMock.ctx.drawImage).toHaveBeenCalledWith(expect.any(Object), 0, 64, 256, 128);
    expect(result).toBe('data:image/png;base64,fake');
    expect(canvasMock.toDataURL).toHaveBeenCalledWith('image/png');
  });
});
