const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('character sheet save/load and cocofolia output', async ({ page, context }) => {
  const fileUrl = 'file://' + path.resolve(__dirname, '../index.html');
  await page.goto(fileUrl);

  // intercept clipboard writes
  await page.addInitScript(() => {
    window.__copiedText = null;
    const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async (text) => {
      window.__copiedText = text;
      return orig(text);
    };
  });

  await page.fill('#name', 'テストキャラ');
  await page.fill('#player_name', 'テストプレイヤー');
  await page.selectOption('#species', 'human');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('.footer-button--save'),
  ]);
  const pathDownloaded = await download.path();
  const json = fs.readFileSync(pathDownloaded, 'utf-8');
  const data = JSON.parse(json);
  expect(data.character.name).toBe('テストキャラ');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click('label[for="load_input_vue"]');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(pathDownloaded);

  await expect(page.locator('#name')).toHaveValue('テストキャラ');
  await expect(page.locator('#player_name')).toHaveValue('テストプレイヤー');

  await page.click('.footer-button--output');
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).not.toBeNull();
});
