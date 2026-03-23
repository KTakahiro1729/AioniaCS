import { messages } from '@/i18n/index.js';

export const ImageManager = {
  /**
   * Loads an image file and returns a promise that resolves with the image data.
   * @param {File} file - The image file to load.
   * @returns {Promise<string>} A promise that resolves with the image data as a base64 string.
   */
  loadImage: function (file) {
    return new Promise((resolve, reject) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10 MB

      if (!file) {
        reject(new Error(messages.image.uploadErrors.noFile));
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        reject(new Error(messages.image.uploadErrors.unsupportedType));
        return;
      }

      if (file.size > maxSize) {
        reject(new Error(messages.image.uploadErrors.tooLarge));
        return;
      }

      // Placeholder for file reading logic
      // In a real implementation, you would use FileReader API
      // console.log(`Simulating loading image: ${file.name}`); // Original console log
      // Simulate async operation using FileReader to get a base64 string
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        reject(new Error(messages.image.uploadErrors.readError));
      };
      reader.readAsDataURL(file); // Reads the file as a base64 encoded string
    });
  },

  /**
   * Removes an image from an array of images at the specified index.
   * (This is a utility function, Vue component might directly splice)
   * @param {Array<string>} imagesArray - The array of image data strings.
   * @param {number} index - The index of the image to remove.
   * @returns {Array<string>} A new array with the image removed.
   */
  removeImage: function (imagesArray, index) {
    if (index >= 0 && index < imagesArray.length) {
      const updatedImagesArray = [...imagesArray];
      updatedImagesArray.splice(index, 1);
      console.log(`Simulating removal of image at index: ${index}`);
      return updatedImagesArray;
    } else {
      console.error('Invalid index for image removal.');
      return imagesArray; // Return original array if index is invalid
    }
  },

  async createThumbnailFromDataUrl(imageSource, { size = 256, mimeType = 'image/png' } = {}) {
    const dataUrl = typeof imageSource === 'string' ? imageSource : await this.loadImage(imageSource);

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(messages.image.uploadErrors.readError));
      image.src = dataUrl;
    });

    if (!globalThis.document?.createElement) {
      throw new Error('Canvas is not supported in this environment.');
    }

    const targetSize = Math.max(1, Number.isFinite(size) ? size : 256);
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context could not be created.');
    }

    const baseWidth = Math.max(1, Number.isFinite(img.width) ? img.width : 0);
    const baseHeight = Math.max(1, Number.isFinite(img.height) ? img.height : 0);
    const scale = Math.min(targetSize / baseWidth, targetSize / baseHeight, 1);
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    const drawWidth = Math.max(1, Math.round(baseWidth * safeScale));
    const drawHeight = Math.max(1, Math.round(baseHeight * safeScale));
    const offsetX = Math.round((targetSize - drawWidth) / 2);
    const offsetY = Math.round((targetSize - drawHeight) / 2);

    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    return canvas.toDataURL(mimeType);
  },
};
