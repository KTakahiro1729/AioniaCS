import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  base: './',
  plugins: [vue(), visualizer({ open: true })],
  resolve: {
    alias: {
      '@sabalessshare': resolve(__dirname, 'src/libs/sabalessshare/src'),
    },
  },
  server: {
    fs: {
      '@': resolve(__dirname, 'src/'),
      allow: ['src/libs/sabalessshare', '.'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/vitest.setup.js',
    include: ['tests/unit/**/*.test.js', 'tests/integrity/**/*.test.js'],
    exclude: ['tests/e2e/**', 'src/libs/sabalessshare/**', 'node_modules/**'],
    alias: {
      '\\?raw$': resolve(__dirname, 'tests/unit/__mocks__/raw.js'),
      '@sabalessshare': resolve(__dirname, 'src/libs/sabalessshare/src'),
      '@auth0/auth0-vue': resolve(__dirname, 'tests/__mocks__/auth0-vue.js'),
    },
  },
});
