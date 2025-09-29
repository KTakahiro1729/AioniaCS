# AioniaCS

慈悲なきアイオニアのための非公式キャラクターシート作成ツールです。

## ホスティング構成

- **Cloudflare Pages**: Vite でビルドしたフロントエンドを配信します（ビルドコマンド: `npm run build`、公開ディレクトリ: `dist/`）。
- **Cloudflare Workers**: 旧 Netlify Functions を移植した API を `/api/*` パスで提供します。
- **Cloudflare R2**: キャラクターデータおよび画像を保存するオブジェクトストレージとして利用します。
- **Auth0**: 既存の認証フローを継続して利用します。

## 必要な環境変数

### Cloudflare Pages（フロントエンド）
| 変数名 | 用途 |
| --- | --- |
| `VITE_AUTH0_DOMAIN` | Auth0 テナントのドメイン。 |
| `VITE_AUTH0_CLIENT_ID` | SPA 向けクライアント ID。 |
| `VITE_AUTH0_API_AUDIENCE` | API Audience（必要に応じて設定）。 |
| `VITE_BUILD_BRANCH` | 任意。ビルドメタデータ表示用。 |
| `VITE_BUILD_HASH` | 任意。ビルドメタデータ表示用。 |
| `VITE_BUILD_DATE` | 任意。ビルドメタデータ表示用。 |

Pages の環境変数は Cloudflare ダッシュボードの「Pages → Settings → Environment Variables」で設定します。

### Cloudflare Workers（バックエンド）
| 変数名 | 用途 |
| --- | --- |
| `VITE_AUTH0_DOMAIN` | Auth0 トークン検証に利用。 |
| `AUTH0_API_AUDIENCE` | トークン検証時の Audience。未指定時は `https://<domain>/api/v2/` を使用します。 |
| `R2_ACCOUNT_ID` | R2 アカウント ID。 |
| `R2_ACCESS_KEY_ID` | R2 用アクセスキー。 |
| `R2_SECRET_ACCESS_KEY` | R2 用シークレットアクセスキー。 |
| `R2_BUCKET_NAME` | 文字データを保存するバケット名。 |

Workers では `wrangler secret put` や `.dev.vars` を利用して各値をバインドしてください。

## ローカル開発

1. 依存関係をインストールします。
   ```bash
   npm install
   ```
2. フロントエンド用の環境変数を `.env.local`（または `.env`）に設定します。
   ```env
   VITE_AUTH0_DOMAIN=example.us.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   VITE_AUTH0_API_AUDIENCE=https://example.us.auth0.com/api/v2/
   ```
3. Workers 用のシークレットを `.dev.vars` に設定します。
   ```env
   VITE_AUTH0_DOMAIN=example.us.auth0.com
   AUTH0_API_AUDIENCE=https://example.us.auth0.com/api/v2/
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret
   R2_BUCKET_NAME=aioniacs
   ```
4. API をローカルで起動します。
   ```bash
   npm run worker:dev
   ```
   デフォルトで `http://127.0.0.1:8787` が立ち上がります。
5. 別ターミナルでフロントエンドを起動します。
   ```bash
   npm run dev
   ```
   Vite の開発サーバーは `/api` リクエストを Workers 開発サーバーへプロキシするよう設定されています。

## テスト

プロジェクトルートで以下を実行できます。

```bash
npm run lint      # ESLint, Stylelint, HTMLHint
npm run test      # Vitest
npm run e2e       # Playwright
```

## デプロイ手順

### Cloudflare Pages
1. Cloudflare ダッシュボードで Pages プロジェクトを作成し、このリポジトリを接続します。
2. ビルドコマンドに `npm run build`、出力ディレクトリに `dist` を指定します。
3. 上記のフロントエンド用環境変数を Pages に設定します。
4. プレビュー環境で動作確認を行った上で本番へ公開します。

### Cloudflare Workers
1. `wrangler.toml` が参照する環境変数を `wrangler secret put` で登録します。
2. `npm run worker:deploy` を実行して Workers へデプロイします。
3. Cloudflare Pages のカスタムドメインまたはルーティングルールで `/api/*` を Workers に向けるよう設定します。

## クレジット

本サイトは [TRPG **「慈悲なきアイオニア」**](https://www.aioniatrpg.com/)（作者: **イチ（フシギ製作所）**）の二次創作であり、bright-trpg さんの[「慈悲なきアイオニア キャラクター作成用ツール（β）」](https://bright-trpg.github.io/aionia_character_maker/)をもとに **あろすてりっく** が作成したものです。

## ライセンス

本リポジトリは **MIT License** の下で公開しています。
公式とは関係のない非公式ツールです。
