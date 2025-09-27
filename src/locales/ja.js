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
        title: '冒険の記録',
        message: 'ログインしています...',
      }),
      success: () => ({ title: '冒険の記録', message: 'ログインしました' }),
      error: (err) => ({
        title: 'ログインに失敗しました',
        message: err.message || err.details || 'もう一度お試しください。',
      }),
    },
    signOut: {
      success: () => ({ title: '冒険の記録', message: 'ログアウトしました' }),
    },
    folderPicker: {
      error: (err) => ({
        title: '冒険の記録',
        message: err?.message || 'フォルダ選択をキャンセルしました',
      }),
    },
    save: {
      loading: () => ({ title: '冒険の記録', message: '記録中...' }),
      success: () => ({ title: '記録が完了しました', message: '' }),
      error: (err) => ({ title: '記録に失敗しました', message: err.message || '' }),
    },
    load: {
      loading: (name) => ({
        title: '冒険の記録',
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
      title: '冒険の記録',
      message: '初期化に失敗しました',
    }),
    signInInitError: () => ({
      title: '冒険の記録',
      message: '初期化に失敗しました',
    }),
  },
  share: {
    copied: (link) => ({ title: '共有リンクをコピーしました', message: link }),
    copyFailed: (err) => ({ title: 'コピー失敗', message: err.message }),
    needSignIn: () => ({
      title: '冒険の記録',
      message: '冒険の記録を利用するにはログインしてください',
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
      title: '読み込み確認',
      message: name ? `「${name}」を読み込みますか？` : '記録を読み込みますか？',
      buttons: [
        { label: '読み込む', value: 'load', variant: 'primary' },
        { label: 'キャンセル', value: 'cancel', variant: 'secondary', duration: 1 },
      ],
    }),
    deleteConfirm: (name) => ({
      title: '削除確認',
      message: name ? `「${name}」を削除しますか？` : '記録を削除しますか？',
      buttons: [
        { label: '削除', value: 'delete', variant: 'primary' },
        { label: 'キャンセル', value: 'cancel', variant: 'secondary', duration: 1 },
      ],
    }),
    delete: {
      successToast: () => ({ title: '削除しました', message: '' }),
      asyncToast: {
        loading: () => ({ title: '削除', message: '記録を削除しています...' }),
        success: () => ({ title: '削除しました', message: '' }),
        error: (err) => ({ title: '削除に失敗しました', message: err.message || '' }),
      },
    },
    export: {
      loading: () => ({ title: '端末へ保存', message: '書き出しています...' }),
      success: () => ({ title: '端末へ保存', message: '保存しました' }),
      error: (err) => ({
        title: '端末へ保存に失敗しました',
        message: err.message || '',
      }),
    },
    listError: () => ({ title: '冒険の記録', message: '記録の読み込みに失敗しました' }),
    ui: {
      title: '冒険の記録',
      subtitle: '旅路の記録をここで整えましょう。',
      unauthenticated: {
        description: '冒険の記録をクラウドに保存すれば、いつでも旅を再開できます。',
        button: 'アカウントにログイン',
        footer: 'クラウドの記録はログイン後に表示されます。',
      },
      loading: {
        message: '記録を読み込んでいます...',
        button: '(少しお待ちください) 記録を読み込んでいます...',
      },
      primary: {
        unsavedMessage: 'このキャラクターはまだクラウドに記録されていません。',
        savedMessage: 'このキャラクターはクラウドに記録されています。',
        recordAction: 'このキャラクターを記録する',
        updateAction: '記録を更新する',
      },
      list: {
        title: 'クラウドの記録',
        empty: 'クラウドの記録はまだありません。最初の冒険を記録しましょう！',
        refresh: '記録を読み直す',
        unnamed: '名もなき冒険者',
        editing: '（編集中）',
      },
      actions: {
        signOut: 'ログアウト',
        load: '読み込む',
        update: '記録を更新する',
        export: '端末へ保存',
        delete: '削除',
        unknownUser: '旅人',
      },
      confirmDelete: {
        message: 'この記録を削除しますか？',
        confirm: 'はい',
        cancel: 'いいえ',
      },
      errors: {
        load: '[！] 記録の読み込み中に問題が発生しました。',
        retry: 'もう一度試す',
      },
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
      cloudHub: '冒険の記録',
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
      saveCloud: '冒険の記録',
      saveCloudNew: '記録する',
      saveCloudOverwrite: '記録を更新',
      saveCloudTitle: '冒険の記録に保存',
      loadCloud: '記録を読み込む',
      loadCloudTitle: '冒険の記録から読み込む',
      saveLocal: '端末に保存',
      saveLocalTitle: '端末に保存',
      loadLocal: '端末読込',
      loadLocalTitle: '端末から読み込む',
    },
    prompts: {
      sharedDataPassword: '共有データのパスワードを入力してください',
    },
    modal: {
      hubTitle: '冒険の記録',
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
