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
    rules: {}
  }
];
