const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.js',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
});
