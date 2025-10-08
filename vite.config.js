import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  base: './',
  plugins: [vue(), visualizer({ open: true })],
  resolve: {
    alias: {},
  },
  server: {
    fs: {
      '@': resolve(__dirname, 'src/'),
      allow: ['.'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/unit/setup.js',
    include: ['tests/unit/**/*.test.js', 'tests/integrity/**/*.test.js'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    alias: {
      '\\?raw$': resolve(__dirname, 'tests/unit/__mocks__/raw.js'),
    },
  },
});
