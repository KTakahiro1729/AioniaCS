const shareLoadErrorTexts = {
  general: '共有データ読み込み失敗',
  invalid: '共有リンクが不正です',
  expired: '共有リンクの有効期限が切れています',
  passwordRequired: 'パスワードが必要です',
  decryptionFailed: '復号に失敗しました',
};

export const messages = {
  cloudStorage: {
    signIn: {
      loading: () => ({
        title: '冒険者の記録',
        message: 'ログインしています...',
      }),
      success: () => ({ title: '冒険者の記録', message: 'ログインしました' }),
      error: (err) => ({
        title: 'ログインに失敗しました',
        message: err.message || err.details || 'もう一度お試しください。',
      }),
    },
    signOut: {
      success: () => ({ title: '冒険者の記録', message: 'ログアウトしました' }),
    },
    folderPicker: {
      error: (err) => ({
        title: '冒険者の記録',
        message: err?.message || 'フォルダ選択をキャンセルしました',
      }),
    },
    save: {
      loading: () => ({ title: '冒険者の記録', message: '記録中...' }),
      success: () => ({ title: '記録が完了しました', message: '' }),
      error: (err) => ({ title: '記録に失敗しました', message: err.message || '' }),
    },
    load: {
      loading: (name) => ({
        title: '冒険者の記録',
        message: `${name} を読み込んでいます...`,
      }),
      success: (name) => ({
        title: '読み込み完了',
        message: `${name} を読み込みました`,
      }),
      error: (err) => ({
        title: '読み込みに失敗しました',
        message: err.message || '不明なエラー',
      }),
    },
    apiInitError: () => ({
      title: '冒険者の記録',
      message: '初期化に失敗しました',
    }),
    signInInitError: () => ({
      title: '冒険者の記録',
      message: '初期化に失敗しました',
    }),
  },
  share: {
    copied: (link) => ({ title: '共有リンクをコピーしました', message: link }),
    copyFailed: (err) => ({ title: 'コピー失敗', message: err.message }),
    needSignIn: () => ({
      title: '冒険者の記録',
      message: '冒険者の記録を利用するにはログインしてください',
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
    featureName: '冒険者の記録',
    modals: {
      loadConfirm: (name) => ({
        title: '読込確認',
        message: name ? `「${name}」を読み込みますか？` : '記録を読み込みますか？',
        buttons: [
          { label: '読込', value: 'load', variant: 'primary' },
          { label: 'キャンセル', value: 'cancel', variant: 'secondary', duration: 1 },
        ],
      }),
    },
    notifications: {
      listError: () => ({ title: '冒険者の記録', message: '記録の読み込みに失敗しました。' }),
      delete: {
        success: () => ({ title: '削除しました', message: '' }),
        async: {
          loading: () => ({ title: '削除', message: '記録を削除しています...' }),
          success: () => ({ title: '削除しました', message: '' }),
          error: (err) => ({ title: '削除に失敗しました', message: err.message || '' }),
        },
      },
      export: {
        loading: () => ({ title: '端末保存', message: '書き出しています...' }),
        success: () => ({ title: '端末保存', message: '保存しました' }),
        error: (err) => ({ title: '端末保存に失敗しました', message: err.message || '' }),
      },
    },
    texts: {
      signInLead: 'クラウドに保存された冒険者の記録を利用するには、ログインしてください。',
      confirmDelete: 'この記録を削除しますか？',
    },
    labels: {
      listTitle: '冒険者一覧',
      unnamed: '名もなき冒険者',
      anonymous: '旅人',
    },
    states: {
      editing: '（編集中）',
      loading: '記録を読み込んでいます...',
      empty: 'クラウドの記録はまだありません...',
      error: '記録の読み込みに失敗しました。',
    },
    actions: {
      login: 'ログイン',
      logout: 'ログアウト',
      refresh: '一覧を更新',
      saveNew: '新規保存',
      overwrite: '上書保存',
      load: '読込',
      saveLocal: '端末保存',
      delete: '削除',
      retry: 'もう一度試す',
      cancel: 'キャンセル',
    },
  },
  image: {
    loadError: (err) => ({ title: '画像読み込み失敗', message: err.message }),
    upload: {
      loading: () => ({ title: '画像アップロード', message: 'アップロードしています...' }),
      success: () => ({ title: '画像アップロード', message: '画像を保存しました。' }),
      error: (err) => ({
        title: '画像アップロード失敗',
        message: err?.message || '画像のアップロードに失敗しました。',
      }),
      inProgress: 'アップロード中...',
    },
    delete: {
      loading: () => ({ title: '画像削除', message: '画像を削除しています...' }),
      success: () => ({ title: '画像削除', message: '画像を削除しました。' }),
      error: (err) => ({
        title: '画像削除失敗',
        message: err?.message || '画像の削除に失敗しました。',
      }),
    },
    signInRequired: () => ({
      title: '画像操作',
      message: '画像を操作するにはログインしてください。',
    }),
    limitReached: (max) => ({
      title: '画像の上限',
      message: `画像は最大${max}枚まで追加できます。`,
    }),
    limitNotice: (max) => `画像は最大${max}枚まで追加できます。`,
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
      cloudHub: '冒険者の記録',
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
      saveCloud: '冒険者の記録',
      saveCloudNew: '記録',
      saveCloudOverwrite: '記録を更新',
      saveCloudTitle: 'サーバーに保存',
      loadCloud: '読込',
      loadCloudTitle: 'サーバーから読み込む',
      saveLocal: '端末保存',
      saveLocalTitle: '端末保存',
      loadLocal: '端末読込',
      loadLocalTitle: '端末から読み込む',
    },
    prompts: {
      sharedDataPassword: '共有データのパスワードを入力してください',
    },
    modal: {
      hubTitle: '冒険者の記録',
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
