# キャラクター画像アップロード機能

キャラクター画像は Cloudflare R2 に保存され、Netlify Functions を経由してアップロードおよび削除されます。本ドキュメントでは追加されたエンドポイントと利用方法、必要な環境変数について説明します。

## 環境変数

| 変数名 | 用途 |
| --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare R2 アカウント ID |
| `R2_ACCESS_KEY_ID` | R2 アクセスキー |
| `R2_SECRET_ACCESS_KEY` | R2 シークレットキー |
| `R2_BUCKET_NAME` | 画像を保存するバケット名 |
| `R2_PUBLIC_BASE_URL` | 画像へアクセスするための公開ベース URL (例: `https://static.example.com/character-images`) |

`R2_PUBLIC_BASE_URL` は末尾にスラッシュを付けずに設定してください。

## エンドポイント

### `POST /.netlify/functions/upload-character-image`

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `imageFolderId` | `string` | ✅ | キャラクターごとに一意なフォルダー ID。クライアントが保持します。 |
| `data` | `string` | ✅ | Base64 形式の画像データ (プレフィックスなし) |
| `contentType` | `string` | ✅ | 画像の MIME タイプ (`image/jpeg` など) |
| `fileName` | `string` | ❌ | 元のファイル名。返却値にも含まれます。 |

レスポンス:

```json
{
  "id": "<生成された画像ID>",
  "key": "<R2 オブジェクトキー>",
  "url": "<公開URL>",
  "contentType": "image/png",
  "fileName": "original.png"
}
```

制限事項:

* 画像フォルダーごとに最大 4 枚まで保存できます。超過時は 400 エラーを返します。
* アップロード可能な形式は `image/jpeg`, `image/png`, `image/gif`, `image/webp` です。

### `POST /.netlify/functions/delete-character-image`

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `imageFolderId` | `string` | ✅ | キャラクターのフォルダー ID |
| `key` | `string` | ✅ | 削除対象の R2 オブジェクトキー |

レスポンス:

```json
{
  "key": "user-id/images/imgfld-xxx/uuid.jpg"
}
```

フォルダー ID とユーザー ID が一致しないキーを渡した場合は 403 エラーとなります。

## クライアント側での利用フロー

1. キャラクター作成時に `imageFolderId` を生成し、キャラクターデータに保持します。
2. アップロード時は以下を順に実行します。
   1. 画像の枚数と MIME タイプを検証。
   2. `browser-image-compression` で最大 1024x1024 に圧縮。
   3. `FileReader` で Base64 文字列に変換し、Netlify Function に送信。
3. レスポンスとして返る `id`, `key`, `url` をキャラクターデータに保存します。
4. 削除時は `imageFolderId` と `key` を Function に渡して削除します。

## 既存データとの互換性

* これまで Base64 文字列として保存されていた画像は、そのまま読み込み・エクスポートできます。
* エクスポート処理は URL 形式の画像を取得して ZIP に含めるよう更新されています。取得に失敗した画像は ZIP には含まれませんが、処理全体は継続します。
