export default {
  '*.{js,vue}': ['eslint --fix', 'prettier --write'],
  '*.css': ['stylelint --fix', 'prettier --write'],
  '*.html': ['htmlhint', 'prettier --write'],
  // 関数形式はステージされたファイル名をコマンドに付加しないため、
  // OSを問わずフルテストを1回だけ実行できる。
  // (`vitest related` はこのプロジェクトのvitest 1.xでは動作しない)
  '{src,tests}/**/*.{js,vue}': () => 'vitest run',
};
