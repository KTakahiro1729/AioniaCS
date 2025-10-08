import { describe, it, beforeAll, beforeEach, expect, vi } from 'vitest';

import { ImageManager } from '@/features/character-sheet/services/imageManager.js';
import { messages } from '@/locales/ja.js';

let fileReaderBehavior;

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
  global.FileReader = MockFileReader;
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
});
