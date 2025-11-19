export const messages = {
  errors: {
    unexpected: '予期せぬエラーが発生しました',
  },
  googleDrive: {
    auth: {
      connected: () => ({ title: 'Google Drive', message: '接続しました' }),
    },
    signOut: {
      success: () => ({ title: 'サインアウトしました', message: '' }),
    },
    folderPicker: {
      unavailable: () => ({ title: 'Google Drive', message: 'フォルダピッカーを利用できません' }),
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
      noSelection: () => ({ title: '読み込みエラー', message: 'ファイルが選択されていません' }),
      missingData: () => ({ title: '読み込みエラー', message: 'キャラクターデータを取得できませんでした' }),
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
    initPending: () => ({
      title: 'Google Drive',
      message: '初期化が完了するまでお待ちください',
    }),
    config: {
      loadError: () => ({ title: '設定読み込み失敗', message: '保存先フォルダの取得に失敗しました' }),
      requiresSignIn: () => ({ title: 'Google Drive', message: 'Googleにサインインしてください' }),
      updateSuccess: () => ({ title: '設定更新', message: '保存先フォルダを更新しました' }),
      updateError: (err) => ({
        title: '設定更新失敗',
        message: err?.message || '保存先フォルダの更新に失敗しました',
      }),
    },
  },
  share: {
    copied: (link) => ({ title: '共有リンクをコピーしました', message: link }),
    copyFailed: (err) => ({ title: 'コピー失敗', message: err.message }),
    needSignIn: () => ({
      title: 'Google Drive',
      message: 'サインインしてください',
    }),
    toast: {
      creating: () => ({ title: '共有リンク', message: '作成中...' }),
      success: () => ({ title: '共有リンク', message: 'URLをコピーしました' }),
      error: (err) => ({
        title: '共有失敗',
        message: err?.message || '共有リンクの生成に失敗しました',
      }),
      clipboardUnavailable: () => ({ title: '共有リンク', message: 'クリップボードにアクセスできません' }),
    },
    errors: {
      saveFailed: 'Google Drive への保存に失敗しました',
      shareFailed: '共有リンクの取得に失敗しました',
      managerMissing: 'Google Drive マネージャーが設定されていません',
    },
    loadError: {
      toast: (key = 'general') => {
        const messagesMap = {
          general: '共有データの読み込みに失敗しました',
          fetchFailed: '共有データの取得に失敗しました',
          parseFailed: '共有データの解析に失敗しました',
        };
        return {
          title: '共有データエラー',
          message: messagesMap[key] || messagesMap.general,
        };
      },
    },
  },
  characterHub: {
    driveFolder: {
      changeButton: '選択',
      label: '保存先フォルダ',
      placeholder: '慈悲なきアイオニア',
    },
    buttons: {
      signIn: 'ログイン／Driveから読み込む',
    },
  },
  image: {
    loadError: (err) => ({ title: '画像読み込み失敗', message: err.message }),
    uploadErrors: {
      noFile: '画像ファイルが選択されていません。',
      unsupportedType: '対応していない画像形式です。JPEG、PNG、GIF、WebP、SVG を指定してください。',
      tooLarge: 'ファイルサイズが大きすぎます（最大10MB）。',
      readError: '画像の読み込み中にエラーが発生しました。',
    },
  },
  dataExport: {
    loadError: (msg) => ({ title: '読み込み失敗', message: msg }),
  },
  file: {
    loadError: 'ファイルの読み込みに失敗しました。JSON形式が正しくない可能性があります。',
    unsupportedFormat: '対応していないファイル形式です。AioniaCSで保存したデータをご利用ください。',
  },
  ui: {
    header: {
      defaultTitle: 'Aionia TRPG Character Sheet',
      helpLabel: '?',
      newCharacter: '新規',
      signIn: 'ログイン',
      signOut: 'ログアウト',
    },
    footer: {
      experience: '経験点',
      output: '出力',
      share: '共有',
      copyEdit: '自分用にコピーして編集',
    },
    viewModeBanner: '閲覧モードで表示中',
    buttons: {
      saveCloudNew: '新規保存',
      saveCloudOverwrite: '上書保存',
      saveCloudTitle: 'Google Driveに保存',
      loadCloud: 'Drive読込',
      loadCloudTitle: 'Google Driveから読込む',
      saveLocal: '端末保存',
      saveLocalTitle: '端末に保存',
      loadLocal: '読込',
      loadLocalTitle: '端末から読込む',
      save: '保存',
    },
    confirmations: {
      unsavedChanges: {
        title: '保存されていない変更があります',
        message: '現在の内容はまだ保存されていません。新規作成すると変更は失われます。続行しますか？',
        buttons: [
          { label: '保存して続行', value: 'save', variant: 'primary' },
          { label: '保存せず続行', value: 'discard', variant: 'secondary' },
          { label: 'キャンセル', value: 'cancel', variant: 'secondary' },
        ],
      },
    },
    modal: {
      load: {
        title: '読込',
        buttons: {
          loadLocal: 'ローカルから読み込む',
          loadDrive: 'Driveから読み込む',
        },
        signInMessage: 'Drive機能を使うにはGoogleにサインインしてください。',
      },
      io: {
        title: '入出力',
        buttons: {
          saveLocal: 'ローカルファイルで出力',
          print: '印刷',
          chatPalette: 'チャットパレットを出力',
        },
        chatPalette: {
          success: () => ({ title: 'チャットパレット', message: 'クリップボードにコピーしました' }),
          error: (err) => ({
            title: 'チャットパレット',
            message: err?.message || 'コピーに失敗しました',
          }),
          clipboardUnavailable: 'クリップボード機能が利用できません',
        },
      },
    },
  },
  sheet: {
    loadIndicator: {
      label: '荷重',
    },
    toggles: {
      showDescription: '説明を表示',
    },
    images: {
      alt: 'キャラクター画像',
      previous: '前の画像',
      next: '次の画像',
      add: '画像を追加',
      delete: '削除',
      deleteAria: '現在の画像を削除',
      empty: '画像はありません',
    },
    placeholders: {
      expertSkill: '専門技能',
      expertSkillDisabled: '専門技能 (技能選択で有効)',
      specialSkillNote: '詳細',
      characterMemo: 'キャラクター背景、設定、その他メモを記入',
      weaponName: '装備名',
      armorName: '装備名',
      adventureMemo: 'メモ',
    },
    aria: {
      deleteItem: '項目を削除',
      removeExpert: '専門技能を削除',
      addExpert: '専門技能を追加',
      removeSpecialSkill: '特技を削除',
      addSpecialSkill: '特技を追加',
      addAdventureLog: '冒険記録を追加',
    },
    sections: {
      basicInfo: {
        title: '基本情報',
        fields: {
          name: 'キャラクター名',
          playerName: 'プレイヤー名',
          species: '種族',
          rareSpecies: '種族名（希少人種）',
          gender: '性別',
          age: '年齢',
          height: '身長',
          weight: '体重',
          origin: '出身地',
          occupation: '職業',
          faith: '信仰',
        },
      },
      scar: {
        title: '傷痕',
        fields: {
          initial: '初期値',
          current: '現在値（初期値+増加分）',
        },
      },
      weakness: {
        title: '弱点',
        columns: {
          text: '弱点',
          acquired: '獲得',
        },
      },
      skills: {
        title: '技能',
      },
      memo: {
        title: 'キャラクターメモ',
      },
      specialSkills: {
        title: '特技',
        columns: {
          group: '種類',
          name: '名称',
          acquired: '獲得',
        },
      },
      items: {
        title: '所持品',
        labels: {
          otherItems: 'その他所持品',
          slots: {
            weapon1: '武器1',
            weapon2: '武器2',
            armor: '防具',
          },
        },
      },
      adventureLog: {
        title: '冒険の記録',
        columns: {
          scenario: 'シナリオ名',
          experience: '経験点',
          scar: '傷痕増加',
        },
      },
    },
  },
  outputButton: {
    default: 'ココフォリア駒出力',
    success: 'コピー完了！',
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
  specialSkillDropdownHelp: '（シナリオ報酬の場合はシナリオ名を選択）',
};
