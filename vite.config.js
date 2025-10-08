import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  base: './',
  plugins: [vue(), visualizer({ open: true })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: {
      '@': resolve(__dirname, 'src'),
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
      '@': resolve(__dirname, 'src'),
      '\\?raw$': resolve(__dirname, 'tests/unit/__mocks__/raw.js'),
    },
  },
});
