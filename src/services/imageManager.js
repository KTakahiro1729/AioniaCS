import imageCompression from 'browser-image-compression';
import { IMAGE_SETTINGS } from '../config/imageSettings.js';

function ensureFileName(file, original) {
  if (file instanceof File && file.name) {
    return file;
  }

  const extension = (original?.name?.split('.').pop() || original?.type?.split('/').pop() || 'png').trim();
  const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, '') || 'png';
  const baseName = 'character-image';
  const name = `${baseName}.${safeExtension}`;
  return new File([file], name, { type: file.type || original?.type || 'image/png' });
}

export const ImageManager = {
  validateFile(file) {
    if (!(file instanceof File)) {
      throw new Error('画像ファイルを選択してください。');
    }

    if (!IMAGE_SETTINGS.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('対応していない画像形式です。JPEG / PNG / GIF / WebP / SVG を使用してください。');
    }

    if (file.size > IMAGE_SETTINGS.MAX_FILE_SIZE_BYTES) {
      throw new Error('ファイルサイズが大きすぎます。10MB以下の画像を選択してください。');
    }
  },

  async prepareForUpload(file) {
    this.validateFile(file);

    if (file.type === 'image/svg+xml') {
      return ensureFileName(file, file);
    }

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: IMAGE_SETTINGS.MAX_DIMENSION,
        initialQuality: IMAGE_SETTINGS.COMPRESSION_QUALITY,
        useWebWorker: true,
        fileType: file.type,
        maxIteration: 10,
      });

      return ensureFileName(compressed, file);
    } catch (error) {
      console.error('Failed to compress image before upload:', error);
      throw new Error('画像の圧縮に失敗しました。');
    }
  },

  removeImage(imagesArray, index) {
    if (!Array.isArray(imagesArray)) {
      return [];
    }

    if (index >= 0 && index < imagesArray.length) {
      const updated = [...imagesArray];
      updated.splice(index, 1);
      return updated;
    }

    return imagesArray;
  },
};
