const shareLoadErrorTexts = {
  general: '共有データ読み込み失敗',
  invalid: '共有リンクが不正です',
  expired: '共有リンクの有効期限が切れています',
  passwordRequired: 'パスワードが必要です',
  decryptionFailed: '復号に失敗しました',
};

export const messages = {
  googleDrive: {
    signIn: {
      loading: () => ({
        title: 'Google Drive',
        message: 'サインインしています...',
      }),
      success: () => ({ title: 'サインイン完了', message: '' }),
      error: (err) => ({
        title: 'サインイン失敗',
        message: err.message || err.details || 'もう一度お試しください。',
      }),
    },
    signOut: {
      success: () => ({ title: 'サインアウトしました', message: '' }),
    },
    folderPicker: {
      error: (err) => ({
        title: 'Google Drive',
        message: err?.message || 'フォルダ選択をキャンセルしました',
      }),
    },
    save: {
      loading: () => ({ title: 'Google Drive', message: '保存中...' }),
      success: () => ({ title: '保存完了', message: '' }),
      error: (err) => ({ title: '保存失敗', message: err.message || '' }),
    },
    load: {
      loading: (name) => ({
        title: 'Google Drive',
        message: `${name} を読み込み中...`,
      }),
      success: (name) => ({
        title: '読込完了',
        message: `${name} を読み込みました`,
      }),
      error: (err) => ({
        title: '読み込みエラー',
        message: err.message || '不明なエラー',
      }),
    },
    overwriteConfirm: (name) => ({
      title: '上書き確認',
      message: `${name} は既に存在します。上書きしますか？`,
      buttons: [
        { label: '上書き', value: 'overwrite', variant: 'primary' },
        { label: 'キャンセル', value: 'cancel', variant: 'secondary', duration: 1 },
      ],
    }),
    apiInitError: () => ({
      title: 'Google API エラー',
      message: '初期化に失敗しました',
    }),
    signInInitError: () => ({
      title: 'Google サインインエラー',
      message: '初期化に失敗しました',
    }),
  },
  share: {
    copied: (link) => ({ title: '共有リンクをコピーしました', message: link }),
    copyFailed: (err) => ({ title: 'コピー失敗', message: err.message }),
    needSignIn: () => ({
      title: 'Google Drive',
      message: 'サインインしてください',
    }),
    generateFailed: (err) => ({
      title: '共有リンク生成失敗',
      message: err.message,
    }),
    loadError: {
      ...shareLoadErrorTexts,
      toast: (key) => ({
        title: '共有データエラー',
        message: shareLoadErrorTexts[key] || shareLoadErrorTexts.general,
      }),
    },
  },
  characterHub: {
    loadConfirm: (name) => ({
      title: '読込確認',
      message: `${name} を読み込みますか？`,
      buttons: [
        { label: '読込', value: 'load', variant: 'primary' },
        { label: 'キャンセル', value: 'cancel', variant: 'secondary', duration: 1 },
      ],
    }),
    deleteConfirm: (name) => ({
      title: '削除確認',
      message: `${name} を削除しますか？`,
      buttons: [
        { label: '削除', value: 'delete', variant: 'primary' },
        { label: 'キャンセル', value: 'cancel', variant: 'secondary', duration: 1 },
      ],
    }),
    delete: {
      successToast: () => ({ title: '削除完了', message: '' }),
      asyncToast: {
        loading: () => ({ title: '削除', message: '削除中...' }),
        success: () => ({ title: '削除完了', message: '' }),
        error: (err) => ({ title: '削除失敗', message: err.message || '' }),
      },
    },
    export: {
      loading: () => ({ title: 'エクスポート', message: 'エクスポート中...' }),
      success: () => ({ title: 'エクスポート完了', message: '' }),
      error: (err) => ({
        title: 'エクスポート失敗',
        message: err.message || '',
      }),
    },
  },
  image: {
    loadError: (err) => ({ title: '画像読み込み失敗', message: err.message }),
  },
  dataExport: {
    loadError: (msg) => ({ title: '読み込み失敗', message: msg }),
  },
  file: {
    loadError: 'ファイルの読み込みに失敗しました。JSON形式が正しくない可能性があります。',
  },
  ui: {
    header: {
      defaultTitle: 'Aionia TRPG Character Sheet',
      cloudHub: 'Cloud Hub',
      helpLabel: '?',
    },
    footer: {
      experience: '経験点',
      io: '入出力',
      share: '共有',
      copyEdit: '自分用にコピーして編集',
    },
    viewModeBanner: '閲覧モードで表示中',
    buttons: {
      saveCloud: 'Drive保存',
      saveCloudNew: '新規保存',
      saveCloudOverwrite: '上書保存',
      saveCloudTitle: 'Google Driveに保存',
      loadCloud: 'Drive読込',
      loadCloudTitle: 'Google Driveから読込む',
      saveLocal: '端末保存',
      saveLocalTitle: '端末に保存',
      loadLocal: '読み込み',
      loadLocalTitle: '端末から読込む',
    },
    prompts: {
      sharedDataPassword: '共有データのパスワードを入力してください',
    },
    modal: {
      hubTitle: 'β　クラウドキャラクター管理',
      generate: '生成',
      shareTitle: '共有リンクを生成',
      cancel: 'キャンセル',
      shareFailed: '共有リンク生成失敗',
      io: {
        title: '入出力',
        buttons: {
          saveLocal: '端末保存',
          loadLocal: '端末読込',
          output: '駒出力',
          print: '印刷',
          driveFolder: 'フォルダ変更',
        },
      },
    },
  },
  outputButton: {
    default: 'ココフォリア駒出力',
    success: 'コピー完了！',
    successFallback: 'コピー完了！ (fallback)',
    failed: 'コピー失敗 (fallback)',
    error: 'コピーエラー (fallback)',
    animating: '冒険が始まる――',
    animationTimings: {
      state1_bgFill: 500,
      state2_textHold: 1000,
      state3_textFadeOut: 500,
      state4_bgReset: 700,
      state5_successHold: 300,
    },
  },
  weaknessDropdownHelp: '（冒険の記録を追加すると選択肢が増えます）',
};
