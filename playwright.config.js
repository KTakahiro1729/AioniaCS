const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/e2e',
  use: { headless: true }
});
