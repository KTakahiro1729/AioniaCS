import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file) => new File([file], `compressed-${file.name}`, { type: file.type })),
}));

const imageCompression = (await import('browser-image-compression')).default;
const { ImageManager } = await import('../../src/services/imageManager.js');
const { IMAGE_SETTINGS } = await import('../../src/config/imageSettings.js');

describe('ImageManager', () => {
  beforeEach(() => {
    imageCompression.mockClear();
  });

  it('validates supported file types and size', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'hero.png', { type: 'image/png' });
    expect(() => ImageManager.validateFile(file)).not.toThrow();
  });

  it('throws when file is not provided', () => {
    expect(() => ImageManager.validateFile(null)).toThrow('画像ファイルを選択してください。');
  });

  it('throws when file type is not supported', () => {
    const file = new File([new Uint8Array([1])], 'hero.bmp', { type: 'image/bmp' });
    expect(() => ImageManager.validateFile(file)).toThrow('対応していない画像形式です。');
  });

  it('throws when file is larger than limit', () => {
    const largeArray = new Uint8Array(IMAGE_SETTINGS.MAX_FILE_SIZE_BYTES + 1);
    const file = new File([largeArray], 'huge.png', { type: 'image/png' });
    expect(() => ImageManager.validateFile(file)).toThrow('ファイルサイズが大きすぎます。');
  });

  it('compresses raster images before upload', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'portrait.jpg', { type: 'image/jpeg' });
    const compressed = await ImageManager.prepareForUpload(file);

    expect(imageCompression).toHaveBeenCalledTimes(1);
    expect(imageCompression).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        maxWidthOrHeight: IMAGE_SETTINGS.MAX_DIMENSION,
        initialQuality: IMAGE_SETTINGS.COMPRESSION_QUALITY,
      }),
    );
    expect(compressed).toBeInstanceOf(File);
    expect(compressed.name).toBe('compressed-portrait.jpg');
  });

  it('returns original SVG file without compression', async () => {
    const file = new File([new TextEncoder().encode('<svg></svg>')], 'icon.svg', { type: 'image/svg+xml' });
    const result = await ImageManager.prepareForUpload(file);
    expect(imageCompression).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('icon.svg');
  });

  it('rethrows compression errors with friendly message', async () => {
    imageCompression.mockImplementationOnce(async () => {
      throw new Error('Unexpected failure');
    });
    const file = new File([new Uint8Array([1])], 'portrait.png', { type: 'image/png' });
    await expect(ImageManager.prepareForUpload(file)).rejects.toThrow('画像の圧縮に失敗しました。');
  });
});
