import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.js', './tests/vitest.setup.js'],
    include: ['tests/unit/**/*.test.js', 'tests/integrity/**/*.test.js'],
    exclude: ['tests/e2e/**', 'src/libs/sabalessshare/**', 'node_modules/**'],
    alias: {
      '\\?raw$': resolve(__dirname, 'tests/unit/__mocks__/raw.js'),
      '@sabalessshare': resolve(__dirname, 'src/libs/sabalessshare/src'),
    },
  },
});
