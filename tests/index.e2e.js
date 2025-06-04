const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('character sheet save/load and cocofolia output', async ({ page, context }) => {
  const fileUrl = 'file://' + path.resolve(__dirname, '../index.html');
  // serve local Vue bundle to avoid external network request
  await page.route('https://unpkg.com/vue@3/dist/vue.global.js', (route) => {
    route.fulfill({ path: path.resolve(__dirname, '../vue.global.js') });
  });
  await page.goto(fileUrl);

  // wait for the select element to be present and force selection to avoid visibility issues
  await page.waitForSelector('#species');
  await page.selectOption('#species', 'human', { force: true });

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
  await page.fill('#gender', '男性');
  await page.fill('#age', '25');
  await page.fill('#height', '170');
  await page.fill('#weight_char', '65');
  await page.fill('#origin', 'テストランド');
  await page.fill('#occupation', '戦士');
  await page.fill('#faith', 'テスト神');
  await page.fill('#initial_scar', '5');
  await page.selectOption('#weapon1', 'combat_small');
  await page.fill('#weapon1_name', '短剣');
  await page.selectOption('#weapon2', 'shooting');
  await page.fill('#weapon2_name', '弓');
  await page.selectOption('#armor', 'light_armor');
  await page.fill('#armor_name', '革鎧');
  await page.fill('#other_items', 'テストの剣');
  await page.fill('#character_text', 'これはテストです');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('.footer-button--save'),
  ]);
  const pathDownloaded = await download.path();
  const json = fs.readFileSync(pathDownloaded, 'utf-8');
  const data = JSON.parse(json);
  expect(data.character.name).toBe('テストキャラ');
  expect(data.character.gender).toBe('男性');
  expect(data.character.age).toBe(25);
  expect(data.equipments.weapon1.group).toBe('combat_small');
  expect(data.equipments.weapon1.name).toBe('短剣');
  expect(data.character.memo).toBe('これはテストです');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click('label[for="load_input_vue"]');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(pathDownloaded);

  await expect(page.locator('#name')).toHaveValue('テストキャラ');
  await expect(page.locator('#player_name')).toHaveValue('テストプレイヤー');
  await expect(page.locator('#gender')).toHaveValue('男性');
  await expect(page.locator('#age')).toHaveValue('25');
  await expect(page.locator('#height')).toHaveValue('170');
  await expect(page.locator('#weight_char')).toHaveValue('65');
  await expect(page.locator('#origin')).toHaveValue('テストランド');
  await expect(page.locator('#occupation')).toHaveValue('戦士');
  await expect(page.locator('#faith')).toHaveValue('テスト神');
  await expect(page.locator('#initial_scar')).toHaveValue('5');
  await expect(page.locator('#current_scar')).toHaveValue('5');
  await expect(page.locator('#weapon1')).toHaveValue('combat_small');
  await expect(page.locator('#weapon1_name')).toHaveValue('短剣');
  await expect(page.locator('#weapon2')).toHaveValue('shooting');
  await expect(page.locator('#weapon2_name')).toHaveValue('弓');
  await expect(page.locator('#armor')).toHaveValue('light_armor');
  await expect(page.locator('#armor_name')).toHaveValue('革鎧');
  await expect(page.locator('#other_items')).toHaveValue('テストの剣');
  await expect(page.locator('#character_text')).toHaveValue('これはテストです');

  await page.click('.footer-button--output');
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).not.toBeNull();
});
