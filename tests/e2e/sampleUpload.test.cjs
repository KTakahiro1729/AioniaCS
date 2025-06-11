const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const INDEX_HTML_PATH = 'http://localhost:4173/AioniaCS/';
const sampleDir = path.resolve(__dirname, '../../sample-data');
const sampleFiles = fs.readdirSync(sampleDir).filter((f) => f.endsWith('.json'));

test.describe('Sample data uploads', () => {
  for (const file of sampleFiles) {
    test(`load ${file} without console errors`, async ({ page }) => {
      await page.goto(INDEX_HTML_PATH);
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.locator('#load_input_vue').setInputFiles(path.join(sampleDir, file));
      await expect(page.locator('#name')).toHaveValue(/.+/);
      for (const msg of errors) {
        expect(msg).not.toContain('Maximum recursive updates exceeded');
      }
    });
  }
});
