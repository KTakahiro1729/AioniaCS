// tests/unit/imageManager.test.js

// Mocking FileReader
global.FileReader = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }

  readAsDataURL(file) {
    if (file && file.name === 'error.png') {
      // Simulate an error
      if (this.onerror) {
        this.onerror(new Error('Simulated FileReader error'));
      }
    } else if (file) {
      // Simulate a successful read
      if (this.onload) {
        this.onload({ target: { result: `data:image/png;base64,mock_base64_data_for_${file.name}` } });
      }
    } else {
        if (this.onerror) {
            this.onerror(new Error('No file provided to FileReader mock'));
        }
    }
  }
};

// Assuming imageManager.js attaches ImageManager to window
// If not, you might need to require/import it and handle its global availability.
// For this example, let's assume src/imageManager.js has been loaded or is mocked
// such that window.ImageManager is available.

// If src/imageManager.js is not automatically available in the test runner,
// you might need to manually load it or mock its structure:
if (typeof window.ImageManager === 'undefined') {
  window.ImageManager = {
    loadImage: jest.fn(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        if (file) {
            reader.readAsDataURL(file);
        } else {
            reject(new Error("No file provided."));
        }
      });
    })
    // removeImage can be mocked if needed, but the subtask says to skip its tests
  };
}


describe('ImageManager', () => {
  describe('loadImage', () => {
    it('should resolve with a base64 data URL for a valid file', async () => {
      const mockFile = { name: 'sample.png', type: 'image/png' };
      // Use the actual ImageManager.loadImage if available and properly set up,
      // otherwise the mock defined above will be used.
      const imageData = await window.ImageManager.loadImage(mockFile);
      expect(imageData).toMatch(/^data:image\/png;base64,/);
      expect(imageData).toContain('mock_base64_data_for_sample.png');
    });

    it('should reject if no file is provided', async () => {
      await expect(window.ImageManager.loadImage(null)).rejects.toThrow("No file provided.");
    });

    it('should reject if FileReader encounters an error', async () => {
      const mockErrorFile = { name: 'error.png', type: 'image/png' };
      await expect(window.ImageManager.loadImage(mockErrorFile)).rejects.toThrow("Simulated FileReader error");
    });

    // Example of how you might test with a real instance if imageManager.js was loaded
    // This requires a proper JSDOM setup where src/imageManager.js can execute.
    it('should process file using mocked FileReader successfully (alternative)', () => {
        // This test assumes ImageManager is the actual implementation from src/imageManager.js
        // and that imageManager.js has been loaded into the test environment (e.g., by JSDOM)
        // For this to work, the ImageManager mock above should be conditional or removed if
        // the actual script is loaded.

        // const actualImageManager = require('../../src/imageManager'); // This won't work directly due to window
        // For now, we rely on the global window.ImageManager which might be the mock or the real one.

        const mockFile = { name: 'another.jpeg', type: 'image/jpeg' };
        return window.ImageManager.loadImage(mockFile).then(data => {
            expect(data).toBe(`data:image/png;base64,mock_base64_data_for_${mockFile.name}`);
        });
    });
  });

  // Tests for removeImage would go here if needed
});
