# AioniaCS セキュリティ監査レポート

**監査日:** 2026-03-23
**監査対象:** AioniaCS リポジトリ全体（Vue 3 + Cloudflare Pages/D1）
**対象ファイル数:** 67ファイル（Vue 31 + JS 36）

---

## 概要

AioniaCS（TRPG キャラクターシート管理アプリ）の包括的なセキュリティ監査を実施しました。
全体的にセキュリティ意識の高い実装がなされていますが、以下の改善点が発見されました。

| 深刻度 | 件数 |
|--------|------|
| 高 | 4 |
| 中 | 7 |
| 低 | 4 |
| 情報 | 3 |

---

## 依存パッケージの脆弱性（npm audit）

`npm audit` の結果、8件の脆弱性（高1件、中7件）が検出されました。

### D-1: flatted ≤3.4.1 — DoS + プロトタイプ汚染 【高】

- **GHSA-25h7-pfq9-p65f:** `parse()` の revive フェーズで無限再帰によるDoS
- **GHSA-rf6f-7fwh-wjgh:** `parse()` によるプロトタイプ汚染
- **修正:** `npm audit fix`

### D-2: dompurify 3.1.3–3.3.1 — XSS脆弱性 【中】

- **GHSA-v2wj-7wpq-c8vv:** DOMPurify自体にXSS脆弱性
- **影響箇所:** `PrivacyPolicyModal.vue`, `HelpPanel.vue`
- **注:** 現在の入力ソース（静的マークダウン）では実害は限定的
- **修正:** `npm audit fix`

### D-3: hono <4.12.7 — プロトタイプ汚染 【中】

- **GHSA-v8w9-8mx6-g223:** `parseBody({ dot: true })` で `__proto__` キーによるプロトタイプ汚染
- **注:** 当プロジェクトでは `parseBody` の `dot` オプション未使用のため実害は低い
- **修正:** `npm audit fix`

### D-4: esbuild ≤0.24.2 / vite / vitest — 開発サーバー情報漏洩 【中】

- **GHSA-67mh-4wv8-2f99:** 開発サーバーに対して任意のリクエストを送信・レスポンスを読取可能
- **注:** 開発環境のみの影響、本番ビルドには影響なし
- **修正:** `npm audit fix --force`（vitest 4.x へのメジャーアップグレードが必要）

---

## 高リスク（High）

### H-1: 印刷テンプレートへのHTML注入（XSS）

- **ファイル:** `src/features/character-sheet/composables/usePrint.js` (L44-46, L147, L166)
- **概要:** `buildHtml()` がキャラクター名・メモ等のユーザー入力をHTMLテンプレートにエスケープなしで展開している。生成されたHTMLは `iframe.srcdoc` や `document.write()` で直接レンダリングされる。
- **攻撃例:** キャラクター名に `<img src=x onerror="alert(document.cookie)">` を入力すると、印刷プレビュー時にJavaScriptが実行される。
- **対策:** テンプレート展開前にHTMLエスケープ関数を適用する。

```javascript
// 推奨: エスケープ関数の追加
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// 使用例
replace('character-name', escapeHtml(ch.name || ''));
```

### H-2: SVG画像アップロードによるXSS

- **ファイル:** `src/features/character-sheet/services/imageManager.js` (L11)
- **概要:** `allowedTypes` に `image/svg+xml` が含まれている。SVGはJavaScriptを埋め込むことが可能で、`data:` URLとして表示される際にスクリプトが実行される可能性がある。
- **対策:** `image/svg+xml` を許可リストから削除する。SVGをサポートする場合はDOMPurifyでサニタイズすること。

```javascript
// 修正: SVGを除外
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
```

### H-3: ZIP展開時のサイズ制限なし（DoS）

- **ファイル:** `src/shared/utils/characterSerialization.js` (L193-213)
- **概要:** `deserializeCharacterPayload()` で ZIP を展開する際、圧縮前・展開後のサイズ制限がない。悪意のある ZIP（ZIP bomb）によりブラウザのメモリを枯渇させる可能性がある。
- **対策:** 展開前にサイズチェックを追加する。

```javascript
// 推奨: サイズ制限の追加
const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB
if (view.byteLength > MAX_ZIP_SIZE) {
  throw new Error('ファイルサイズが大きすぎます');
}
```

---

## 中リスク（Medium）

### M-1: Google Drive API クエリインジェクション

- **ファイル:** `src/infrastructure/google-drive/googleDriveManager.js` (L178, L445-447, L502, L725-729)
- **概要:** Google Drive API の検索クエリでシングルクォートのみエスケープ (`replace(/'/g, "\\'")`) しているが、バックスラッシュの二重エスケープが不十分。`configFileName` はハードコードされているため現時点での実害は限定的だが、`folderName` や `fileName` はユーザー入力に近い値が渡る可能性がある。
- **注:** `listFiles()` (L502) では `folderId` が直接クエリ文字列に埋め込まれており、folderId が外部から操作された場合にクエリ構造が破壊される可能性がある。
- **対策:** エスケープ関数を強化し、バックスラッシュも処理する。

```javascript
function escapeQueryValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
```

### M-2: OAuth スコープが過剰

- **ファイル:** `functions/api/[[route]].js` (L7)
- **概要:** `AUTH_SCOPE` に `openid email profile` が含まれている。Drive操作に必要なのは `drive.appdata` と `drive.file` のみ。
- **対策:** 必要最小限のスコープのみを要求する。ユーザー情報が不要な場合は `openid email profile` を削除する。

### M-3: セッション有効期限が長すぎる

- **ファイル:** `functions/api/[[route]].js` (L9)
- **概要:** `SESSION_TTL_SECONDS` が30日に設定されている。リフレッシュトークンを保持するセッションとしては長すぎる。
- **対策:** 7〜14日に短縮することを推奨。

### M-4: レート制限なし

- **ファイル:** `functions/api/[[route]].js`
- **概要:** OAuth エンドポイント (`/api/auth/login`, `/api/auth/callback`, `/api/auth/status`) にレート制限が実装されていない。
- **対策:** Cloudflare の Rate Limiting ルールまたは Hono ミドルウェアでレート制限を追加する。

### M-5: エラーログに機密情報が漏洩する可能性

- **ファイル:** `functions/api/[[route]].js` (L183, L283, L318)
- **概要:** `console.error` でエラーオブジェクト全体をログ出力しており、トークンやスタックトレースなどの機密情報が Cloudflare のログに記録される可能性がある。
- **対策:** エラーメッセージのみをログ出力し、完全なエラーオブジェクトは出力しない。

```javascript
// 修正前
console.error('Session lookup error:', error);
// 修正後
console.error('Session lookup error:', error?.message || 'Unknown error');
```

---

## 低リスク（Low）

### L-1: Cookie の SameSite が Lax

- **ファイル:** `functions/api/[[route]].js` (L152)
- **概要:** セッション Cookie の `sameSite` が `'Lax'` に設定されている。`Lax` はトップレベルナビゲーションで Cookie を送信するため、一部の CSRF シナリオに対して脆弱になり得る。ただし、状態変更操作は POST メソッド（`/api/auth/logout`）に限定されており、GET エンドポイントは読み取り専用のため、現状のリスクは限定的。
- **対策:** 可能であれば `'Strict'` に変更する。OAuth コールバックが動作しなくなる場合は `Lax` のまま維持しつつ、POST エンドポイントに CSRF トークンを追加する。

### L-2: パスワードコンポーネントの露出

- **ファイル:** `src/features/modals/components/contents/PasswordPromptModal.vue`
- **概要:** パスワード入力値が `defineExpose({ password })` で親コンポーネントに公開されている。使用後の自動クリアやタイムアウト機構がない。
- **対策:** 使用後にパスワード値をクリアする処理を追加する。

### L-3: 非推奨API `document.execCommand('copy')` の使用

- **ファイル:** `src/shared/utils/clipboard.js` (L6-16)
- **概要:** クリップボードコピーのフォールバックとして非推奨の `document.execCommand('copy')` を使用している。
- **対策:** Clipboard API (`navigator.clipboard.writeText`) のみに統一することを検討。

### L-4: `constantTimeEqual` の早期リターン

- **ファイル:** `functions/api/[[route]].js` (L30-41)
- **概要:** `constantTimeEqual` 関数は長さが異なる場合に即座に `false` を返す。これによりタイミング攻撃で長さ情報が漏洩する可能性がある。HMAC署名比較では署名長が固定のため実害は極めて低い。
- **対策:** 長さが異なる場合も固定時間で比較する実装に変更するとより安全。

---

## 情報（Informational）

### I-1: Content Security Policy (CSP) ヘッダー未設定

- **ファイル:** `index.html`
- **概要:** CSP ヘッダーが設定されていない。XSS 攻撃の影響を軽減するために CSP を導入することを推奨。
- **対策:** Cloudflare Pages の `_headers` ファイルまたは `wrangler.toml` で CSP を設定する。

### I-2: CORS 設定が未定義

- **ファイル:** `functions/api/[[route]].js`
- **概要:** Hono アプリケーションに明示的な CORS 設定がない。Cloudflare Pages Functions はデフォルトで同一オリジンポリシーに従うが、明示的に設定する方がベター。
- **対策:** Hono の CORS ミドルウェアを追加し、許可オリジンを明示する。

### I-3: セキュリティ関連の良い実装

以下のセキュリティ対策が適切に実装されていることを確認：

- **DOMPurify による XSS 防止:** `PrivacyPolicyModal.vue`, `HelpPanel.vue` で `marked` + `DOMPurify` による適切なサニタイズを実施
- **postMessage のオリジン検証:** `googleDriveManager.js` (L372) で `event.origin !== window.location.origin` チェックを実施
- **CSRF 対策 (state パラメータ):** OAuth フローで HMAC 署名付き state パラメータを使用し、タイミング安全な比較を実施
- **セッション ID の暗号学的生成:** `crypto.getRandomValues` を使用した128ビットのランダムセッションID
- **パラメータバインディング:** D1 データベースクエリで全てプレースホルダ (`?`) を使用しており、SQL インジェクションを防止
- **Cookie のセキュリティ属性:** `httpOnly: true`, `secure: true` が設定済み
- **画像アップロードのサイズ制限:** 10MB の上限が設定済み
- **ファイル名のサニタイズ:** `sanitizeFileName()` で危険な文字を除去

---

## 優先対応順位

| 優先度 | 項目 | 対応難易度 |
|--------|------|------------|
| 1 | D-1: flatted の更新（`npm audit fix`） | 低 |
| 2 | D-2: dompurify の更新（`npm audit fix`） | 低 |
| 3 | D-3: hono の更新（`npm audit fix`） | 低 |
| 4 | H-1: 印刷テンプレートのHTMLエスケープ | 低 |
| 5 | H-2: SVGアップロードの禁止 | 低 |
| 6 | H-3: ZIP展開のサイズ制限 | 低 |
| 7 | M-1: Drive APIクエリエスケープ強化 | 低 |
| 8 | M-5: エラーログの機密情報除去 | 低 |
| 9 | M-4: レート制限の追加 | 中 |
| 10 | M-2: OAuthスコープの最小化 | 低 |
| 11 | M-3: セッション有効期限の短縮 | 低 |
| 12 | D-4: vitest/esbuild の更新（破壊的変更あり） | 高 |
| 13 | I-1: CSPヘッダーの設定 | 中 |
