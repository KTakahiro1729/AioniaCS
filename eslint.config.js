const vue = require("eslint-plugin-vue");

module.exports = [
  {
    files: ["src/**/*.js", "tests/**/*.js", "./*.js"],
    languageOptions: {
      globals: {
        window: "readonly",
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      vue,
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": "warn",
    },
  },
];
