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
    modal: {
      signInMessage: '共有リンクを作成するには Google Drive にサインインしてください。',
      signInButton: 'Google Drive にサインイン',
      instructions: '共有リンクをコピーして相手に送ってください。リンクを開くと閲覧モードでキャラシを表示します。',
      generating: '共有リンクを作成しています…',
      ready: '共有リンクが作成されました。',
      retry: '再試行',
      copy: 'コピー',
      errorDefault: '共有リンクの作成に失敗しました。時間をおいて再度お試しください。',
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
    driveFolder: {
      changeButton: '選択',
      label: '保存先フォルダ',
      placeholder: '慈悲なきアイオニア',
    },
    buttons: {
      load: 'Driveから読み込む',
      saveNew: '新しい冒険者として保存',
      overwrite: '上書き保存',
      signOut: 'ログアウト',
      signIn: 'Googleにログイン',
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
      cloudHub: 'Cloud Hub',
      helpLabel: '?',
      gmTable: 'GMテーブル',
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
      hubTitle: 'クラウド連携',
      shareTitle: '共有リンク',
      cancel: 'キャンセル',
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
      scarWeakness: {
        title: '傷痕と弱点',
        scar: {
          title: '傷痕',
          initial: '初期値',
          current: '現在値（初期値+増加分）',
        },
        weakness: {
          title: '弱点',
          columns: {
            text: '弱点',
            acquired: '獲得',
          },
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
          memo: 'メモ',
        },
      },
    },
  },
  gmTable: {
    pageTitle: 'GMテーブル',
    pageSubtitle: 'セッション中の仲間たちを俯瞰し、瞬時に判断するための指令卓',
    headers: {
      characterName: 'キャラクター名',
    },
    rows: {
      memo: 'キャラクターメモ',
      weakness: '弱点',
      skills: '技能',
      specialSkills: '特技',
      weight: '荷重',
      skillToggle: {
        detail: '詳細表示に切り替え',
        summary: '一覧表示に戻す',
      },
    },
    characterMenu: {
      edit: '編集',
      reload: '再読込',
      remove: '削除',
    },
    actions: {
      backToSheet: 'キャラシへ戻る',
      saveSession: 'GMセッション保存',
      loadSession: 'GMセッション読み込み',
      openCharacterMenu: (name) => `${name}の操作メニューを開く`,
    },
    labels: {
      unknownCharacter: '名もなき冒険者',
      noWeakness: '登録された弱点はありません',
      noSkill: '習得技能なし',
      noExpert: '専門技能なし',
      noSpecialSkill: '特技は未習得です',
    },
    placeholders: {
      characterMemo: 'セッション用メモを記入',
    },
    weight: {
      penaltyNone: 'ペナルティなし',
      penaltyLight: '軽度ペナルティ',
      penaltyHeavy: '重度ペナルティ',
    },
    session: {
      memoTitle: 'セッション全体メモ',
      defaultFileName: 'gm-session.json',
    },
    toasts: {
      added: {
        title: 'キャラクター追加',
        message: (fileName) => `${fileName} を読み込みました`,
      },
      reloaded: {
        title: 'キャラクター更新',
        message: (fileName) => `${fileName} を再読込しました`,
      },
      removed: {
        title: 'キャラクター削除',
        message: 'テーブルからキャラクターを削除しました',
      },
      loadError: {
        title: '読み込み失敗',
      },
      sessionSaved: {
        title: 'セッション保存',
        message: '現在のテーブルをJSONとして保存しました',
      },
      sessionLoaded: {
        title: 'セッション読込',
        message: 'GMセッションデータを読み込みました',
      },
      sessionLoadError: {
        title: 'セッション読込失敗',
      },
    },
    errors: {
      characterLoad: 'キャラクターデータの解析に失敗しました',
    },
    confirm: {
      delete: (name) => `${name} をテーブルから削除しますか？`,
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
  specialSkillDropdownHelp: '（シナリオ報酬の場合はシナリオ名を選択）',
};
