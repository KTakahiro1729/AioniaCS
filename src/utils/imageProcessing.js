import imageCompression from 'browser-image-compression';

export const MAX_IMAGE_DIMENSION = 1024;
export const MAX_IMAGES_PER_CHARACTER = 4;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function validateImageLimit(currentCount, filesToAdd = 1, limit = MAX_IMAGES_PER_CHARACTER) {
  if (currentCount + filesToAdd > limit) {
    throw new Error(`画像は最大${limit}枚までです。`);
  }
}

export function validateImageType(file, allowedTypes = ALLOWED_IMAGE_TYPES) {
  if (!file) {
    throw new Error('ファイルが選択されていません。');
  }
  if (!allowedTypes.includes(file.type)) {
    throw new Error('対応していないファイル形式です。');
  }
}

export async function compressImageFile(file, options = {}) {
  if (!file) {
    throw new Error('ファイルが選択されていません。');
  }

  const compressionOptions = {
    maxWidthOrHeight: MAX_IMAGE_DIMENSION,
    useWebWorker: true,
    ...options,
  };

  return imageCompression(file, compressionOptions);
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('ファイルが選択されていません。'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
