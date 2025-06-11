import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  reporter: [['html'], ['github']],
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  webServer: {
    command: 'npm run ci:e2e',
    url: 'http://localhost:5173',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_E2E_TESTING: 'true',
    },
  },
});
