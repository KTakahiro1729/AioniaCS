export const DriveMessages = {
  ui: {
    signIn: "Googleアカウントでサインイン",
    signOut: "サインアウト",
    chooseFolder: "保存先フォルダを選択",
    driveMenuTitle: "Google Drive連携",
    driveMenuTitleSignedIn: "Google Drive連携中",
    driveMenuAriaLabel: "Google Drive連携メニュー",
    driveMenuAriaLabelSignedIn: "Google Drive連携メニュー（サインイン済み）",
  },
  status: {
    initializing: "連携機能を初期化中です...",
    gapiReady: "Google APIの準備ができました。",
    gisReady: "サインインの準備ができました。",
    signInPrompt: "サインインしてください。",
    signingIn: "サインイン処理中です...",
    signedIn: (folderName) => `現在のフォルダ: ${folderName || "未選択"}`,
    folderSelection: "フォルダを選択してください...",
    folderSetup: "保存用フォルダを準備中です...",
    saving: (folderName) => `「${folderName}」に保存中です...`,
    loading: (fileName) => `「${fileName}」を読み込み中です...`,
  },
  notifications: {
    saveSuccess: (fileName) => `「${fileName}」を保存しました。`,
    loadSuccess: (fileName) => `「${fileName}」を読み込みました。`,
    folderSelected: (folderName) => `保存先を「${folderName}」に設定しました。`,
    signInSuccess: "サインインに成功しました。",
    signOutSuccess: "サインアウトしました。",
  },
  guidance: {
    initialHelp:
      "Google Driveと連携して、キャラクターデータをクラウドに保存できます。",
    folderSelectNeeded:
      "データを保存・読込するには、Google Drive内のフォルダを選択してください。",
  },
  errors: {
    signInFailed:
      "サインインに失敗しました。ポップアップがブロックされていないか確認し、再度お試しください。",
    folderNotFound:
      "保存先フォルダが見つかりませんでした。再度フォルダを選択してください。",
    permissionDenied:
      "Google Driveへのアクセスが拒否されました。再度サインインし、権限を許可してください。",
    network: "ネットワークエラーが発生しました。接続を確認してください。",
    fileLoad: (fileName) => `「${fileName}」の読み込みに失敗しました。`,
    saveFailed: (error) => `保存エラー: ${error}`,
    unknown: (error) => `予期しないエラーが発生しました: ${error}`,
  },
};
