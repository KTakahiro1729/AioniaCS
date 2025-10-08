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

  test.describe('Image Handling', () => {
    test('saves as ZIP without images, then uploads and displays an image', async ({ page }) => {
      const characterNameInput = page.locator('#name');
      await characterNameInput.fill('ZipSaveCharNoImage');

      // 1. Save with no images (should be ZIP)
      const [zipDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('button.footer-button--save:has-text("端末保存")').click(),
      ]);
      expect(zipDownload.suggestedFilename()).toMatch(/^ZipSaveCharNoImage_\d{14}\.zip$/);

      // 2. Upload image
      const imageUploadInput = page.locator('#character_image_upload');
      await imageUploadInput.setInputFiles(SAMPLE_IMAGE_PATH);

      // 3. Verify image display
      const imageDisplay = page.locator('.character-image-display');
      await expect(imageDisplay).toBeVisible();
      const imageSrc = await imageDisplay.getAttribute('src');
      expect(imageSrc).toMatch(/^data:image\/png;base64,/);

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
      const removeButton = page.locator('.imagefile-button--delete:has-text("削除")');

      // Upload 3 images
      await imageUploadInput.setInputFiles(SAMPLE_IMAGE_PATH);
      await expect(imageCountDisplay).toHaveText('1 / 1');
      let firstImageSrc = await imageDisplay.getAttribute('src');

      await imageUploadInput.setInputFiles(SAMPLE_IMAGE_PATH_2);
      await expect(imageCountDisplay).toHaveText('2 / 2');
      let secondImageSrc = await imageDisplay.getAttribute('src');
      expect(secondImageSrc).not.toBe(firstImageSrc);

      await imageUploadInput.setInputFiles(SAMPLE_IMAGE_PATH); // Upload a third image
      await expect(imageCountDisplay).toHaveText('3 / 3');
      let thirdImageSrc = await imageDisplay.getAttribute('src');
      expect(thirdImageSrc).not.toBe(secondImageSrc);

      // Initial state: image 3 of 3 is shown
      await expect(imageDisplay).toHaveAttribute('src', thirdImageSrc);

      // Navigate previous to image 2
      await prevButton.click();
      await expect(imageCountDisplay).toHaveText('2 / 3');
      await expect(imageDisplay).toHaveAttribute('src', secondImageSrc);

      // Navigate previous to image 1
      await prevButton.click();
      await expect(imageCountDisplay).toHaveText('1 / 3');
      await expect(imageDisplay).toHaveAttribute('src', firstImageSrc);

      // Loop to last
      await prevButton.click();
      await expect(imageCountDisplay).toHaveText('3 / 3');
      await expect(imageDisplay).toHaveAttribute('src', thirdImageSrc);

      // Loop to first
      await nextButton.click();
      await expect(imageCountDisplay).toHaveText('1 / 3');
      await expect(imageDisplay).toHaveAttribute('src', firstImageSrc);

      // Remove current image (image 1)
      await removeButton.click();
      await expect(imageCountDisplay).toHaveText('1 / 2');
      await expect(imageDisplay).toHaveAttribute('src', secondImageSrc);

      // Remove current image (was image 2)
      await removeButton.click();
      await expect(imageCountDisplay).toHaveText('1 / 1');
      await expect(imageDisplay).toHaveAttribute('src', thirdImageSrc);

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
      expect(zipDownload.suggestedFilename()).toMatch(/^ZipSaveChar_\d{14}\.zip$/);
    });

    test.skip('loads character data and image from ZIP file', async ({ page }) => {
      const fileUploadInput = page.locator('#load_input_vue');
      await fileUploadInput.setInputFiles(TEST_ZIP_PATH);

      await expect(page.locator('#name')).toHaveValue('ZippyLoaded', {
        timeout: 5000,
      });

      const imageDisplay = page.locator('.character-image-display');
      await expect(imageDisplay).toBeVisible();
      const imageSrc = await imageDisplay.getAttribute('src');
      expect(imageSrc).toMatch(/^data:image\/.+;base64,/);

      const imageCountDisplay = page.locator('.image-count-display');
      await expect(imageCountDisplay).toHaveText('1 / 1');
    });
  });

  test('updates Drive folder path and saves using configured hierarchy', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());

    const characterNameInput = page.locator('#name');
    await characterNameInput.fill('MockE2E');

    await page.locator('.icon-button').first().click();
    const modal = page.locator('.modal');
    await modal.waitFor({ state: 'visible' });

    const signInButton = page.locator('button:has-text("Googleにログイン")');
    await signInButton.waitFor({ state: 'visible' });
    await expect(signInButton).toBeEnabled({ timeout: 10000 });
    await signInButton.click();

    const saveNewButton = page.locator('button:has-text("新しい冒険者として保存")');
    await expect(saveNewButton).toBeVisible({ timeout: 10000 });
    await expect(saveNewButton).toBeEnabled({ timeout: 10000 });

    const folderInput = page.locator('#drive_folder_path');
    await expect(folderInput).toHaveValue('慈悲なきアイオニア');

    const desiredPath = '慈悲なきアイオニア/PC/第一キャンペーン';

    await page.evaluate(async (path) => {
      const module = await import('/src/infrastructure/google-drive/mockGoogleDriveManager.js');
      let manager;
      try {
        manager = module.getMockGoogleDriveManagerInstance();
      } catch (error) {
        manager = module.initializeMockGoogleDriveManager('', '');
      }
      manager.state.folderPickerQueue = [path];
    }, desiredPath);

    const changeButton = page.locator('.character-hub--change-button');
    await changeButton.click();
    await expect(folderInput).toHaveValue(desiredPath);

    await saveNewButton.click();

    await page.waitForFunction(() => {
      const stateRaw = localStorage.getItem('mockGoogleDriveData');
      if (!stateRaw) return false;
      try {
        const state = JSON.parse(stateRaw);
        return Object.values(state.files || {}).some((file) => file.name === 'MockE2E.zip');
      } catch (e) {
        return false;
      }
    });

    const driveState = await page.evaluate(() => JSON.parse(localStorage.getItem('mockGoogleDriveData')));
    expect(driveState.config.characterFolderPath).toBe('慈悲なきアイオニア/PC/第一キャンペーン');

    const savedFile = Object.values(driveState.files).find((file) => file.name === 'MockE2E.zip');
    expect(savedFile).toBeTruthy();

    const buildPath = (folderId) => {
      const segments = [];
      let current = driveState.folders[folderId];
      while (current) {
        segments.unshift(current.name);
        current = driveState.folders[current.parentId];
      }
      return segments.join('/');
    };

    expect(buildPath(savedFile.parentId)).toBe('慈悲なきアイオニア/PC/第一キャンペーン');
  });
});
