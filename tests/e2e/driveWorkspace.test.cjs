const { test, expect } = require('@playwright/test');

const INDEX_HTML_PATH = 'http://localhost:4173/AioniaCS/';

test.describe('Google Drive workspace flow (mock)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(INDEX_HTML_PATH);
  });

  test('signs in and saves a character to the Drive workspace', async ({ page }) => {
    await page.locator('#name').fill('E2E Hero');

    await page.locator('button:has-text("Cloud Hub")').click();

    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    const signInButton = modal.locator('.character-hub-controls__button', { hasText: 'Googleにログイン' });
    await signInButton.click();

    await expect(modal.locator('.character-hub-controls__button', { hasText: 'ログアウト' })).toBeVisible();

    await expect(modal.locator('.character-hub__folder-label')).toHaveText('保存先フォルダ: AioniaCS');

    const saveNewButton = modal.locator('.character-hub-controls__button', { hasText: '新規保存' });
    await saveNewButton.click();

    const listItem = modal.locator('.character-hub__item').first();
    await expect(listItem).toContainText('E2E Hero');
    await expect(listItem).toHaveClass(/character-hub__item--active/);

    const dateText = await listItem.locator('.character-hub__date').innerText();
    expect(dateText).toMatch(/^更新: /);
  });
});
