import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  base: "./",
  plugins: [vue(), visualizer({ open: true })],
  resolve: {
    alias: {
      "@sabalessshare": resolve(__dirname, "src/libs/sabalessshare/src"),
    },
  },
  server: {
    fs: {
      "@": resolve(__dirname, "src/"),
      allow: ["src/libs/sabalessshare", "."],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/unit/setup.js",
    include: ["tests/unit/**/*.test.js", "tests/integrity/**/*.test.js"],
    exclude: ["tests/e2e/**", "src/libs/sabalessshare/**", "node_modules/**"],
    alias: {
      "\\?raw$": resolve(__dirname, "tests/unit/__mocks__/raw.js"),
      "@sabalessshare": resolve(__dirname, "src/libs/sabalessshare/src"),
    },
  },
});
