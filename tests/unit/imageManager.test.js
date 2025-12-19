import { describe, it, beforeAll, beforeEach, afterEach, afterAll, expect, test, vi } from 'vitest';
import { ImageManager } from '@/features/character-sheet/services/imageManager.js';
import { messages } from '@/i18n/index.js';

let fileReaderBehavior;
let originalFileReader;

class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }

  readAsDataURL() {
    if (fileReaderBehavior?.type === 'error') {
      this.onerror?.(fileReaderBehavior.error || new Error('Mock read error'));
      return;
    }

    const result = fileReaderBehavior?.result || 'data:image/mock;base64,default';
    this.onload?.({ target: { result } });
  }
}

beforeAll(() => {
  originalFileReader = global.FileReader;
  global.FileReader = MockFileReader;
});

afterAll(() => {
  global.FileReader = originalFileReader;
});

beforeEach(() => {
  fileReaderBehavior = { type: 'success', result: 'data:image/png;base64,mock-data' };
});

describe('ImageManager', () => {
  describe('loadImage', () => {
    const validFile = { name: 'sample.png', type: 'image/png', size: 1024 };

    it('resolves with FileReader data when reading succeeds', async () => {
      fileReaderBehavior = { type: 'success', result: 'data:image/png;base64,success' };

      await expect(ImageManager.loadImage(validFile)).resolves.toBe('data:image/png;base64,success');
    });

    it('rejects with readError message when FileReader fails', async () => {
      fileReaderBehavior = { type: 'error', error: new Error('FileReader failure') };

      await expect(ImageManager.loadImage(validFile)).rejects.toThrow(messages.image.uploadErrors.readError);
    });

    it('rejects with noFile message when no file is provided', async () => {
      await expect(ImageManager.loadImage(null)).rejects.toThrow(messages.image.uploadErrors.noFile);
    });

    it('rejects with unsupportedType message when MIME type is not allowed', async () => {
      const unsupportedFile = { name: 'sample.txt', type: 'text/plain', size: 1024 };

      await expect(ImageManager.loadImage(unsupportedFile)).rejects.toThrow(messages.image.uploadErrors.unsupportedType);
    });

    it('rejects with tooLarge message when file size exceeds 10MB', async () => {
      const oversizedFile = { name: 'huge.png', type: 'image/png', size: 11 * 1024 * 1024 };

      await expect(ImageManager.loadImage(oversizedFile)).rejects.toThrow(messages.image.uploadErrors.tooLarge);
    });
  });

  describe('removeImage', () => {
    it('returns a new array without the removed image when index is valid', () => {
      const images = ['a', 'b', 'c'];

      const result = ImageManager.removeImage(images, 1);

      expect(result).toEqual(['a', 'c']);
      expect(result).not.toBe(images);
    });

    it('returns the original array when index is invalid', () => {
      const images = ['a', 'b'];

      const result = ImageManager.removeImage(images, 5);

      expect(result).toBe(images);
    });
  });

  describe('thumbnail generation', () => {
    let originalImage;
    let originalDocument;
    let canvasMock;
    let nextImageDimensions;

    beforeEach(() => {
      originalImage = global.Image;
      originalDocument = global.document;
      nextImageDimensions = { width: 800, height: 400 };

      class FakeImage {
        constructor() {
          this.width = nextImageDimensions.width;
          this.height = nextImageDimensions.height;
          this.onload = null;
          this.onerror = null;
        }

        set src(value) {
          this.width = nextImageDimensions.width;
          this.height = nextImageDimensions.height;
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

    test('createThumbnailFromDataUrl guards against zero or invalid dimensions', async () => {
      nextImageDimensions = { width: 0, height: 0 };
      const dataUrl = 'data:image/png;base64,bbbb';

      const result = await ImageManager.createThumbnailFromDataUrl(dataUrl, { size: 128 });

      const drawArgs = canvasMock.ctx.drawImage.mock.calls[0];
      expect(drawArgs[1]).toBeGreaterThanOrEqual(0);
      expect(drawArgs[2]).toBeGreaterThanOrEqual(0);
      expect(drawArgs[3]).toBeGreaterThan(0);
      expect(drawArgs[4]).toBeGreaterThan(0);
      expect(Number.isFinite(drawArgs[3])).toBe(true);
      expect(Number.isFinite(drawArgs[4])).toBe(true);
      expect(result).toBe('data:image/png;base64,fake');
      expect(canvasMock.width).toBe(128);
      expect(canvasMock.height).toBe(128);
    });
  });
});
