const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  workers: process.env.CI ? 2 : undefined,
  use: {
    headless: true,
    baseURL: 'http://localhost:4173/AioniaCS/'
  },
  webServer: {
    command: 'npx vite --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
