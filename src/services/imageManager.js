// src/imageManager.js

export const ImageManager = {
  /**
   * Loads an image file and returns a promise that resolves with the image data.
   * @param {File} file - The image file to load.
   * @returns {Promise<string>} A promise that resolves with the image data as a base64 string.
   */
  loadImage: function (file) {
    return new Promise((resolve, reject) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
      const maxSize = 10 * 1024 * 1024; // 10 MB

      if (!file) {
        reject(new Error("No file provided."));
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        reject(
          new Error(
            "Unsupported file type. Please upload JPEG, PNG, GIF, or WebP images.",
          ),
        );
        return;
      }

      if (file.size > maxSize) {
        reject(new Error("File is too large. Maximum size is 10MB."));
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
        console.error("FileReader error:", e);
        reject(new Error("Error reading file."));
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
      console.error("Invalid index for image removal.");
      return imagesArray; // Return original array if index is invalid
    }
  },
};
