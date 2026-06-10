# モックGoogle Drive(開発用)

`VITE_USE_MOCK_DRIVE=true` を設定して起動すると、Google認証やバックエンドなしで
Drive連携機能を試せるモック実装(`MockGoogleDriveManager`)が使われます。
データは `localStorage`(キー: `mockGoogleDriveData`)に保存され、リロード後も保持されます。

```bash
VITE_USE_MOCK_DRIVE=true npm run dev
```

## 実装との対応

モックは実装(`GoogleDriveManager`)と同じpublicメソッドを持ち、主要な挙動を再現します:

- サインイン/サインアウト状態とトークン管理(サインアウト中のDrive操作は
  `Authentication required.` で失敗)
- 設定フォルダの存在確認と自動再作成(フォルダが消えた場合は実装と同様に作り直す)
- 削除済みファイルの更新は実装の404相当のエラー
  (`Parent folder not found. Please select a new folder.`)をスロー
- 共有(`ensureFilePublic` / `unshareFile`)と一覧での `shared` フラグ

APIの乖離は `tests/unit/mockGoogleDriveManager.test.js` の契約テストで検出されます。
実装にpublicメソッドを追加した場合はモックにも追加してください。

## 障害シミュレーション

エラーハンドリング(トースト表示、リトライ等)の動作確認用に、開発コンソールから
失敗や遅延を注入できます。インスタンスは `window.__DRIVE_DEV__` に公開されています。

```js
// saveFile を1回だけ失敗させる(2回目以降は成功)
__DRIVE_DEV__.simulateFailure('saveFile', { times: 1 });

// 全メソッドをカスタムエラーで失敗させ続ける
__DRIVE_DEV__.simulateFailure('*', { error: 'network down' });

// 全操作に2秒の遅延を加える(ローディング表示の確認用)
__DRIVE_DEV__.setLatency(2000);

// 解除
__DRIVE_DEV__.clearSimulatedFailures();
__DRIVE_DEV__.setLatency(0);

// 保存データごと初期状態に戻す
__DRIVE_DEV__.reset();
```

シミュレーション設定はメモリ上のみで、`localStorage` には永続化されません
(リロードで解除されます)。
