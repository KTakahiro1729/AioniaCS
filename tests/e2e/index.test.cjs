const { test, expect } = require('@playwright/test');
const path = require('path');

const INDEX_HTML_PATH = 'http://localhost:4173/AioniaCS/';
const SAMPLE_IMAGE_PATH = path.resolve(__dirname, '../fixtures/sample.png');
const TEST_ZIP_PATH = path.resolve(__dirname, '../fixtures/test_char.zip');

test.describe('Character Sheet E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(INDEX_HTML_PATH);
  });

  test('can input character name', async ({ page }) => {
    const nameInput = page.locator('#name');
    await nameInput.fill('テストキャラ');
    await expect(nameInput).toHaveValue('テストキャラ');
  });

  test.describe('Image Handling', () => {
    test('displays error toast when attempting image upload while signed out', async ({ page }) => {
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

      // 3. Verify that no image is shown and an error toast is displayed
      const imageDisplay = page.locator('.character-image-display');
      await expect(imageDisplay).toBeHidden();
      const toast = page.locator('.toast.toast--error .toast-message');
      await expect(toast).toContainText('画像を操作するにはログインしてください。');
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
