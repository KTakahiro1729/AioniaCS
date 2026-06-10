import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'src/**/*.vue', 'tests/**/*.js', './*.js', 'vite.config.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
        // Google API クライアントはスクリプトタグ経由で読み込まれるグローバル
        gapi: 'readonly',
        google: 'readonly',
      },
    },
    plugins: {
      vue: pluginVue,
    },
    rules: {
      semi: ['error', 'always'],
      'no-unused-vars': 'warn',
    },
  },
  ...pluginVue.configs['flat/essential'],
  eslintConfigPrettier,
];
