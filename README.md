# AioniaCS

慈悲なきアイオニアのための非公式キャラクターシート作成ツールです

## 使い方

最新版は [GitHub Pages](https://ktakahiro1729.github.io/AioniaCS/) で公開しています。

## Google Cloud API 利用箇所

- Google Drive 連携の初期化は `src/app/main.js` で行い、`VITE_GOOGLE_API_KEY` と `VITE_GOOGLE_CLIENT_ID` を使って本番用またはモック用のドライブマネージャーを構築します。
- クラウド同期のフロントロジックは `src/features/cloud-sync/composables/useGoogleDrive.js` にあり、`https://apis.google.com/js/api.js` で提供される Google API クライアント（Drive/Picker）と `https://accounts.google.com/gsi/client` で提供される Google Identity Services を読み込み、GAPI クライアントと GIS トークンクライアントを初期化します。
- Drive API への具体的なリクエスト（フォルダー作成、ファイル一覧取得、マルチパートでのアップロード、Picker を使ったファイル／フォルダー選択など）は `src/infrastructure/google-drive/googleDriveManager.js` で実装されています。
- Auth0 経由のログイン・トークン配布を行う場合、`VITE_AUTH0_DOMAIN`、`VITE_AUTH0_CLIENT_ID`、`VITE_AUTH0_AUDIENCE`（および Auth0 から Google アクセストークンを受け取るための `VITE_AUTH0_DRIVE_TOKEN_URL`）を設定し、`/debug` ルートのデバッグページからセッション状態や Drive トークンの適用状況を確認できます。

## クレジット

本サイトは [TRPG **「慈悲なきアイオニア」**](https://www.aioniatrpg.com/)（作者: **イチ（フシギ製作所）**）の二次創作であり、**あろすてりっく** が作成したものです。

## ライセンス

本リポジトリは **MIT License** の下で公開しています。
公式とは関係のない非公式ツールです。
