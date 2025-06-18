import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    files: ["src/**/*.js", "tests/**/*.js", "./*.js", "vite.config.js"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        // プロジェクト固有のグローバル変数
        AioniaGameData: "readonly",
        deepClone: "readonly",
        createWeaknessArray: "readonly",
        ImageManager: "readonly",
        DataManager: "readonly",
        CocofoliaExporter: "readonly",
        GoogleDriveManager: "readonly",
        Vue: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
      },
    },
    plugins: {
      vue: pluginVue,
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": "warn",
    },
  },
  ...pluginVue.configs["flat/essential"],
  eslintConfigPrettier,
];
