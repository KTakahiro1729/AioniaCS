const { test, expect } = require('@playwright/test');
const path = require('path');

const INDEX_HTML_PATH = 'http://localhost:4173/AioniaCS/';
const SAMPLE_IMAGE_PATH = path.resolve(__dirname, '../fixtures/sample.png');
const SAMPLE_IMAGE_PATH_2 = path.resolve(__dirname, '../fixtures/sample2.png'); // Assume another sample image for multi-image tests
const TEST_ZIP_PATH = path.resolve(__dirname, '../fixtures/test_char.zip');

// Helper to create a dummy file if sample2.png doesn't exist (Playwright needs actual files for upload)
const fs = require('fs');
if (!fs.existsSync(SAMPLE_IMAGE_PATH_2)) {
  fs.copyFileSync(SAMPLE_IMAGE_PATH, SAMPLE_IMAGE_PATH_2);
}

test.describe('Character Sheet E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(INDEX_HTML_PATH);
  });

  test('can input character name', async ({ page }) => {
    const nameInput = page.locator('#name');
    await nameInput.fill('テストキャラ');
    await expect(nameInput).toHaveValue('テストキャラ');
  });

  test('Google Drive sign-in is disabled until APIs finish loading', async ({ page }) => {
    await page.locator('.main-header .icon-button').click();
    const signInButton = page.locator('.character-hub--button', { hasText: 'Googleにログイン' });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeDisabled();

    await page.evaluate(() => {
      window.gapi = {
        load: (_modules, callback) => callback(),
        client: {
          init: () => Promise.resolve(),
          getToken: () => ({ access_token: 'token' }),
          setToken: () => {},
          request: () => Promise.resolve({ result: {} }),
          drive: { files: {} },
        },
      };
      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: () => ({
              requestAccessToken: () => {},
            }),
            revoke: (_token, cb) => cb(),
          },
        },
        picker: {
          Response: { ACTION: 'action', DOCUMENTS: 'docs' },
          Action: { PICKED: 'picked', CANCEL: 'cancel' },
          View: function () {
            this.setParent = () => {};
            this.setMimeTypes = () => {};
          },
          ViewId: { DOCS: 'docs' },
          Feature: { NAV_HIDDEN: 'nav_hidden' },
          PickerBuilder: function () {
            this.setOrigin = () => this;
            this.addView = () => this;
            this.enableFeature = () => this;
            this.setOAuthToken = () => this;
            this.setCallback = () => this;
            this.build = () => ({ setVisible: () => {} });
            return this;
          },
        },
      };

      const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (gapiScript) {
        gapiScript.dispatchEvent(new Event('load'));
      }
      const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (gisScript) {
        gisScript.dispatchEvent(new Event('load'));
      }
    });

    await expect(signInButton).toBeEnabled();
  });

  test.describe('Image Handling', () => {
    test('uploads, displays image, and saves JSON (no images initially, then one image)', async ({ page }) => {
      const characterNameInput = page.locator('#name');
      await characterNameInput.fill('JsonSaveChar');

      // 1. Save with no images (JSON)
      // Intercept downloads
      const [jsonDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('button.footer-button--save:has-text("端末保存")').click(),
      ]);
      // expect(jsonDownload.suggestedFilename()).toBe('JsonSaveChar_AioniaSheet.json');
      expect(jsonDownload.suggestedFilename()).toMatch(/^JsonSaveChar_\d{14}\.json$/);

      // 2. Upload image
      const imageUploadInput = page.locator('#character_image_upload');
      await imageUploadInput.setInputFiles(SAMPLE_IMAGE_PATH);

      // 3. Verify image display
      const imageDisplay = page.locator('.character-image-display');
      await expect(imageDisplay).toBeVisible();
      const imageSrc = await imageDisplay.getAttribute('src');
      expect(imageSrc).toMatch(/^data:image\/png;base64,/); // Or whatever type sample.png is if specific

      // 4. Verify image count
      const imageCountDisplay = page.locator('.image-count-display');
      await expect(imageCountDisplay).toHaveText('1 / 1');
    });

    test('image navigation and removal', async ({ page }) => {
      const imageUploadInput = page.locator('#character_image_upload');
      const imageDisplay = page.locator('.character-image-display');
      const imageCountDisplay = page.locator('.image-count-display');
      const nextButton = page.locator('.button-imagenav:has-text(">")');
      const prevButton = page.locator('.button-imagenav:has-text("<")');
      // const removeButton = page.locator('.button-remove:has-text("Remove Current Image")');
      const removeButton = page.locator('.imagefile-button--delete:has-text("削除")');

      // Upload 3 images (using sample & sample2, then sample again for a third distinct one in array)
      await imageUploadInput.setInputFiles(SAMPLE_IMAGE_PATH);
      await expect(imageCountDisplay).toHaveText('1 / 1');
      let firstImageSrc = await imageDisplay.getAttribute('src');

      await imageUploadInput.setInputFiles(SAMPLE_IMAGE_PATH_2);
      await expect(imageCountDisplay).toHaveText('2 / 2'); // Should be current index + 1 / length
      let secondImageSrc = await imageDisplay.getAttribute('src');
      expect(secondImageSrc).not.toBe(firstImageSrc); // Check if src changed

      await imageUploadInput.setInputFiles(SAMPLE_IMAGE_PATH); // Upload a third image
      await expect(imageCountDisplay).toHaveText('3 / 3');
      let thirdImageSrc = await imageDisplay.getAttribute('src');
      expect(thirdImageSrc).not.toBe(secondImageSrc);

      // Initial state: image 3 of 3 is shown (index 2)
      await expect(imageDisplay).toHaveAttribute('src', thirdImageSrc);

      // Navigate previous to image 2 (index 1)
      await prevButton.click();
      await expect(imageCountDisplay).toHaveText('2 / 3');
      await expect(imageDisplay).toHaveAttribute('src', secondImageSrc);

      // Navigate previous to image 1 (index 0)
      await prevButton.click();
      await expect(imageCountDisplay).toHaveText('1 / 3');
      await expect(imageDisplay).toHaveAttribute('src', firstImageSrc);

      // Try to go previous from first image (should loop to last)
      await prevButton.click();
      await expect(imageCountDisplay).toHaveText('3 / 3');
      await expect(imageDisplay).toHaveAttribute('src', thirdImageSrc);

      // Go to next from last image (should loop to first)
      await nextButton.click();
      await expect(imageCountDisplay).toHaveText('1 / 3');
      await expect(imageDisplay).toHaveAttribute('src', firstImageSrc);

      // Remove current image (image 1 at index 0)
      await removeButton.click();
      await expect(imageCountDisplay).toHaveText('1 / 2'); // Now showing new image at index 0 (old image 2)
      await expect(imageDisplay).toHaveAttribute('src', secondImageSrc); // secondImageSrc was originally at index 1, now at 0

      // Remove current image (new image at index 0, old image 2)
      await removeButton.click();
      await expect(imageCountDisplay).toHaveText('1 / 1'); // Now showing last remaining image (old image 3)
      await expect(imageDisplay).toHaveAttribute('src', thirdImageSrc); // thirdImageSrc was originally at index 2, now at 0

      // Remove last image
      await removeButton.click();
      await expect(page.locator('.character-image-placeholder')).toBeVisible();
      await expect(imageCountDisplay).not.toBeVisible();
      await expect(removeButton).toBeDisabled();
    });

    test('saves as ZIP when images are present', async ({ page }) => {
      await page.locator('#name').fill('ZipSaveChar');
      const imageUploadInput = page.locator('#character_image_upload');
      await imageUploadInput.setInputFiles(SAMPLE_IMAGE_PATH);
      await expect(page.locator('.character-image-display')).toBeVisible();

      const [zipDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('button.footer-button--save:has-text("端末保存")').click(),
      ]);
      // expect(zipDownload.suggestedFilename()).toBe('ZipSaveChar_AioniaSheet.zip');
      expect(zipDownload.suggestedFilename()).toMatch(/^ZipSaveChar_\d{14}\.zip$/);
    });

    // Skipping this test as it requires a pre-made ZIP file with specific internal structure,
    // which cannot be dynamically created with current tooling.
    test.skip('loads character data and image from ZIP file', async ({ page }) => {
      // This test assumes `tests/fixtures/test_char.zip` is structured correctly:
      // - character_data.json (e.g., with name "ZipLoadTestCharName")
      // - images/sample_in_zip.png
      // (The placeholder test_char.zip won't actually work like this, but the test logic is what's being demonstrated)

      const fileUploadInput = page.locator('#load_input_vue'); // Assuming this is the ID for general file load
      await fileUploadInput.setInputFiles(TEST_ZIP_PATH);

      // Add a small delay or wait for a specific element that indicates loading is complete.
      // For example, wait for the character name to be populated.
      // This depends on how character_data.json in your test_char.zip is defined.
      // For this example, let's assume character_data.json has {"character": {"name": "ZippyLoaded"}}
      await expect(page.locator('#name')).toHaveValue('ZippyLoaded', {
        timeout: 5000,
      }); // Wait for name

      const imageDisplay = page.locator('.character-image-display');
      await expect(imageDisplay).toBeVisible();
      const imageSrc = await imageDisplay.getAttribute('src');
      expect(imageSrc).toMatch(/^data:image\/.+;base64,/); // Check if an image is loaded

      const imageCountDisplay = page.locator('.image-count-display');
      await expect(imageCountDisplay).toHaveText('1 / 1'); // Assuming one image in the test zip
    });
  });
});
