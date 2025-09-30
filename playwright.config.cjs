const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  use: {
    headless: true,
    baseURL: 'http://localhost:4173/AioniaCS/',
  },
  webServer: {
    command: 'cross-env VITE_USE_MOCK_DRIVE=true npx vite --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
