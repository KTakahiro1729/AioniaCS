import { messages } from '@/i18n/index.js';

export const ImageManager = {
  /**
   * Loads an image file and returns a promise that resolves with the image data.
   * @param {File} file - The image file to load.
   * @returns {Promise<string>} A promise that resolves with the image data as a base64 string.
   */
  loadImage: function (file) {
    return new Promise((resolve, reject) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
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

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context could not be created.');
    }

    const scale = Math.min(size / (img.width || size), size / (img.height || size), 1);
    const drawWidth = Math.max(1, Math.round((img.width || size) * scale));
    const drawHeight = Math.max(1, Math.round((img.height || size) * scale));
    const offsetX = Math.round((size - drawWidth) / 2);
    const offsetY = Math.round((size - drawHeight) / 2);

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    return canvas.toDataURL(mimeType);
  },
};
