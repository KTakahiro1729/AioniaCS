import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('browser-image-compression', () => {
  return {
    default: vi.fn(async (file, options) => ({ ...file, options })),
  };
});

import imageCompression from 'browser-image-compression';
import {
  MAX_IMAGE_DIMENSION,
  MAX_IMAGES_PER_CHARACTER,
  ALLOWED_IMAGE_TYPES,
  compressImageFile,
  validateImageLimit,
  validateImageType,
} from '../../../src/utils/imageProcessing.js';

describe('imageProcessing utilities', () => {
  beforeEach(() => {
    imageCompression.mockClear();
  });

  describe('validateImageLimit', () => {
    it('allows adding images when limit is not exceeded', () => {
      expect(() => validateImageLimit(2, 1)).not.toThrow();
    });

    it('throws an error when limit would be exceeded', () => {
      expect(() => validateImageLimit(MAX_IMAGES_PER_CHARACTER, 1)).toThrowError(/最大/);
    });
  });

  describe('validateImageType', () => {
    it('accepts allowed image types', () => {
      const file = new File(['foo'], 'foo.png', { type: ALLOWED_IMAGE_TYPES[0] });
      expect(() => validateImageType(file)).not.toThrow();
    });

    it('rejects unsupported image types', () => {
      const file = new File(['foo'], 'foo.txt', { type: 'text/plain' });
      expect(() => validateImageType(file)).toThrowError(/対応していない/);
    });
  });

  describe('compressImageFile', () => {
    it('compresses using configured dimensions', async () => {
      const file = new File(['data'], 'image.png', { type: 'image/png' });
      const compressed = await compressImageFile(file);
      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxWidthOrHeight: MAX_IMAGE_DIMENSION,
          useWebWorker: true,
        }),
      );
      expect(compressed.options.maxWidthOrHeight).toBe(MAX_IMAGE_DIMENSION);
    });
  });
});
