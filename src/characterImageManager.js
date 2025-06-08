// src/characterImageManager.js

export class CharacterImageManager {
  constructor(vueAppContext) {
    this.app = vueAppContext; // vueAppContext is the Vue app instance from main.js
  }

  async handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    // Ensure imageManagerInstance is available on the Vue app instance
    if (!this.app.imageManagerInstance) {
      console.error("ImageManager not initialized on Vue app");
      // Optionally, use the UIManager to show an error to the user
      if (this.app.uiManager && typeof this.app.uiManager.showCustomAlert === 'function') {
        this.app.uiManager.showCustomAlert("Image manager is not ready.");
      } else {
        // Fallback if uiManager is not available or showCustomAlert is not there
        alert("Image manager is not ready.");
      }
      return;
    }
    try {
      const imageData = await this.app.imageManagerInstance.loadImage(file);
      if (!this.app.character.images) {
        this.app.character.images = [];
      }
      this.app.character.images.push(imageData);
      this.app.currentImageIndex = this.app.character.images.length - 1;
    } catch (error) {
      console.error("Error loading image:", error);
      // Use UIManager to show an error if available
      if (this.app.uiManager && typeof this.app.uiManager.showCustomAlert === 'function') {
        this.app.uiManager.showCustomAlert("画像の読み込みに失敗しました：" + error.message);
      } else {
        alert("画像の読み込みに失敗しました：" + error.message);
      }
    } finally {
      // Reset file input to allow uploading the same file again if needed
      event.target.value = null;
    }
  }

  nextImage() {
    if (
      this.app.character &&
      this.app.character.images &&
      this.app.character.images.length > 0
    ) {
      this.app.currentImageIndex =
        (this.app.currentImageIndex + 1) % this.app.character.images.length;
    }
  }

  previousImage() {
    if (
      this.app.character &&
      this.app.character.images &&
      this.app.character.images.length > 0
    ) {
      this.app.currentImageIndex =
        (this.app.currentImageIndex - 1 + this.app.character.images.length) %
        this.app.character.images.length;
    }
  }

  removeCurrentImage() {
    if (
      this.app.character &&
      this.app.character.images &&
      this.app.character.images.length > 0 &&
      this.app.currentImageIndex >= 0 &&
      this.app.currentImageIndex < this.app.character.images.length
    ) {
      this.app.character.images.splice(this.app.currentImageIndex, 1);
      if (this.app.character.images.length === 0) {
        this.app.currentImageIndex = -1; // Or some indicator for no image
      } else if (this.app.currentImageIndex >= this.app.character.images.length) {
        // If the last image was removed, adjust index to the new last image
        this.app.currentImageIndex = this.app.character.images.length - 1;
      }
      // If an image from the middle was removed, currentImageIndex might still be valid
      // or might need adjustment if it pointed past the new array end,
      // the above condition handles the "past end" case.
      // If it's now pointing to the new image at the same index, that's usually fine.
    }
  }
}
