const { test, expect } = require('@playwright/test');
const path = require('path');

test('can input character name', async ({ page }) => {
  const filePath = 'file://' + path.resolve(__dirname, '../index.html');
  await page.goto(filePath);
  const nameInput = page.locator('#name');
  await nameInput.fill('テストキャラ');
  await expect(nameInput).toHaveValue('テストキャラ');
});
