// src/imageManager.js

window.ImageManager = {
  /**
   * Loads an image file and returns a promise that resolves with the image data.
   * @param {File} file - The image file to load.
   * @returns {Promise<string>} A promise that resolves with the image data as a base64 string.
   */
  loadImage: function(file) {
    return new Promise((resolve, reject) => {
      // Placeholder for file reading logic
      // In a real implementation, you would use FileReader API
      if (file) {
        console.log(`Simulating loading image: ${file.name}`);
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
      } else {
        reject(new Error("No file provided."));
      }
    });
  },

  /**
   * Removes an image from an array of images at the specified index.
   * (This is a utility function, Vue component might directly splice)
   * @param {Array<string>} imagesArray - The array of image data strings.
   * @param {number} index - The index of the image to remove.
   * @returns {Array<string>} A new array with the image removed.
   */
  removeImage: function(imagesArray, index) {
    if (index >= 0 && index < imagesArray.length) {
      const updatedImagesArray = [...imagesArray];
      updatedImagesArray.splice(index, 1);
      console.log(`Simulating removal of image at index: ${index}`);
      return updatedImagesArray;
    } else {
      console.error("Invalid index for image removal.");
      return imagesArray; // Return original array if index is invalid
    }
  }
};
