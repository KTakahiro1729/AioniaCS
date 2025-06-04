const vue = require('eslint-plugin-vue');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        Vue: 'readonly',
        window: 'readonly'
      },
      ecmaVersion: 'latest',
      sourceType: 'script'
    },
    plugins: {
      vue
    },
    rules: {
      semi: ['error', 'always'],
      'no-unused-vars': 'warn'
    }
  }
];
