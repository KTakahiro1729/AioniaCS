// Aionia RPG ゲームデータ
export const AioniaGameData = {
  // 特技データ
  specialSkillData: {
    tactics: [
      { value: 'concealed_weapon', label: '暗器', description: '（暗器）説明プレースホルダー' },
      { value: 'fence_off', label: '受け流し', description: '（受け流し）説明プレースホルダー' },
      { value: 'covering_fire', label: '援護射撃', description: '（援護射撃）説明プレースホルダー' },
      { value: 'stance', label: '構え', description: '（構え）説明プレースホルダー' },
      { value: 'riding_combat', label: '騎乗戦闘', description: '（騎乗戦闘）説明プレースホルダー' },
      { value: 'fatal_spot_attack', label: '急所の一撃', description: '（急所の一撃）説明プレースホルダー' },
      { value: 'high_angle_fire', label: '曲射', description: '（曲射）説明プレースホルダー' },
      { value: 'ready_to_die', label: '決死の覚悟', description: '（決死の覚悟）説明プレースホルダー' },
      { value: 'martial_arts', label: '拳闘術', description: '（拳闘術）説明プレースホルダー' },
      { value: 'escort', label: '護衛', description: '（護衛）説明プレースホルダー' },
      { value: 'heavy_attack', label: '重撃', description: '（重撃）説明プレースホルダー' },
      { value: 'risk_attack', label: '捨て身の一撃', description: '（捨て身の一撃）説明プレースホルダー' },
      { value: 'machine_gunning', label: '掃射', description: '（掃射）説明プレースホルダー' },
      { value: 'snipe', label: '狙撃', description: '（狙撃）説明プレースホルダー' },
      { value: 'provoke', label: '挑発', description: '（挑発）説明プレースホルダー' },
      { value: 'lightning_speed', label: '電光石火', description: '（電光石火）説明プレースホルダー' },
      { value: 'rush', label: '突撃', description: '（突撃）説明プレースホルダー' },
      { value: 'cleave', label: '凪払い', description: '（凪払い）説明プレースホルダー' },
      { value: 'knock_shooting', label: '弾き落とし', description: '（弾き落とし）説明プレースホルダー' },
      { value: 'parry', label: 'パリィ', description: '（パリィ）説明プレースホルダー' },
      { value: 'feint', label: 'フェイント', description: '（フェイント）説明プレースホルダー' },
      { value: 'throw_weapon', label: '武器投げの習熟', description: '（武器投げの習熟）説明プレースホルダー' },
      { value: 'break_weapon', label: '武器破壊', description: '（武器破壊）説明プレースホルダー' },
      { value: 'fortitude', label: '不屈', description: '（不屈）説明プレースホルダー' },
      { value: 'gait', label: '歩法', description: '（歩法）説明プレースホルダー' },
      { value: 'anticipate', label: '見切り', description: '（見切り）説明プレースホルダー' },
      { value: 'pierce_armor', label: '鎧通し', description: '（鎧通し）説明プレースホルダー' },
    ],
    magic: [
      { value: 'light', label: '灯り', description: '（灯り）説明プレースホルダー' },
      { value: 'dozing', label: '居眠り', description: '（居眠り）説明プレースホルダー' },
      { value: 'enchant', label: 'エンチャント', description: '（エンチャント）説明プレースホルダー' },
      { value: 'send_sound', label: '音送り', description: '（音送り）説明プレースホルダー' },
      { value: 'silence', label: '音消し', description: '（音消し）説明プレースホルダー' },
      { value: 'recovery', label: '回復', description: '（回復）説明プレースホルダー' },
      { value: 'read_wind', label: '風読み', description: '（風読み）説明プレースホルダー' },
      { value: 'activate', label: '活性', description: '（活性）説明プレースホルダー' },
      { value: 'fear', label: '恐怖', description: '（恐怖）説明プレースホルダー' },
      { value: 'warning', label: '警報', description: '（警報）説明プレースホルダー' },
      { value: 'barrier', label: '結界', description: '（結界）説明プレースホルダー' },
      { value: 'illusion', label: '幻影', description: '（幻影）説明プレースホルダー' },
      { value: 'telecommunication', label: '交信', description: '（交信）説明プレースホルダー' },
      { value: 'power_of_word', label: '言霊', description: '（言霊）説明プレースホルダー' },
      { value: 'ritual_of_spirit', label: '死儀', description: '（死儀）説明プレースホルダー' },
      { value: 'heal', label: '治癒', description: '（治癒）説明プレースホルダー' },
      { value: 'calling', label: '通話', description: '（通話）説明プレースホルダー' },
      { value: 'familiar', label: '使い魔', description: '（使い魔）説明プレースホルダー' },
      { value: 'ignite', label: '点火', description: '（点火）説明プレースホルダー' },
      { value: 'extend_magic', label: '範囲魔術', description: '（範囲魔術）説明プレースホルダー' },
      { value: 'light_brush', label: '光の筆', description: '（光の筆）説明プレースホルダー' },
      { value: 'cover', label: '被覆', description: '（被覆）説明プレースホルダー' },
      { value: 'float', label: '浮遊', description: '（浮遊）説明プレースホルダー' },
      { value: 'magic_weapon', label: '魔術の得物', description: '（魔術の得物）説明プレースホルダー' },
    ],
    features: [
      { value: 'wisdom', label: '叡智', description: '（叡智）説明プレースホルダー' },
      { value: 'concentrate', label: '過集中', description: '（過集中）説明プレースホルダー' },
      { value: 'acrobatics', label: '軽業', description: '（軽業）説明プレースホルダー' },
      { value: 'connivance', label: '看破', description: '（看破）説明プレースホルダー' },
      { value: 'thin', label: '希薄', description: '（希薄）説明プレースホルダー' },
      { value: 'cajolery', label: '口車', description: '（口車）説明プレースホルダー' },
      { value: 'connection', label: 'コネクション', description: '（コネクション）説明プレースホルダー' },
      { value: 'change_clothes', label: '様変わりの衣', description: '（様変わりの衣）説明プレースホルダー' },
      { value: 'hide_object', label: '仕込み', description: '（仕込み）説明プレースホルダー' },
      { value: 'auto_writing', label: '自動筆記具', description: '（自動筆記具）説明プレースホルダー' },
      { value: 'pickpocket', label: 'スリの極意', description: '（スリの極意）説明プレースホルダー' },
      { value: 'instant', label: '即席', description: '（即席）説明プレースホルダー' },
      { value: 'infinite_bagpack', label: '底なしの鞄', description: '（底なしの鞄）説明プレースホルダー' },
      { value: 'training', label: '調教', description: '（調教）説明プレースホルダー' },
      { value: 'instruction', label: '伝授', description: '（伝授）説明プレースホルダー' },
      { value: 'cleverness', label: '天性の小手先', description: '（天性の小手先）説明プレースホルダー' },
      { value: 'adaptability', label: '踏破', description: '（踏破）説明プレースホルダー' },
      { value: 'cipher', label: '独自暗号', description: '（独自暗号）説明プレースホルダー' },
      { value: 'spoofing', label: 'なりすまし', description: '（なりすまし）説明プレースホルダー' },
      { value: 'beauty', label: '美貌', description: '（美貌）説明プレースホルダー' },
      { value: 'other_name', label: '二つ名', description: '（二つ名）説明プレースホルダー' },
      { value: 'decompose', label: '分解', description: '（分解）説明プレースホルダー' },
      { value: 'honor', label: '誉れ', description: '（誉れ）説明プレースホルダー' },
      { value: 'night_vision', label: '夜目', description: '（夜目）説明プレースホルダー' },
    ],
  },

  // 基本技能定義
  baseSkills: [
    {
      id: 'motion',
      name: '運動',
      checked: false,
      canHaveExperts: true,
      experts: [{ value: '' }],
    },
    {
      id: 'avoidance',
      name: '回避',
      checked: false,
      canHaveExperts: false,
      experts: [],
    },
    {
      id: 'sense',
      name: '感覚',
      checked: false,
      canHaveExperts: true,
      experts: [{ value: '' }],
    },
    {
      id: 'observation',
      name: '観察',
      checked: false,
      canHaveExperts: true,
      experts: [{ value: '' }],
    },
    {
      id: 'technique',
      name: '技巧',
      checked: false,
      canHaveExperts: true,
      experts: [{ value: '' }],
    },
    {
      id: 'shooting',
      name: '射撃',
      checked: false,
      canHaveExperts: true,
      experts: [{ value: '' }],
    },
    {
      id: 'sociality',
      name: '社交',
      checked: false,
      canHaveExperts: true,
      experts: [{ value: '' }],
    },
    {
      id: 'knowledge',
      name: '知識',
      checked: false,
      canHaveExperts: true,
      experts: [{ value: '' }],
    },
    {
      id: 'combat',
      name: '白兵',
      checked: false,
      canHaveExperts: true,
      experts: [{ value: '' }],
    },
    {
      id: 'defense',
      name: '防御',
      checked: false,
      canHaveExperts: false,
      experts: [],
    },
  ],

  // 特技の順序
  externalSkillOrder: [
    'motion',
    'avoidance',
    'sense',
    'observation',
    'technique',
    'shooting',
    'sociality',
    'knowledge',
    'combat',
    'defense',
  ],

  // 備考が必要な特技
  specialSkillsRequiringNote: [
    'enchant',
    'ritual_of_spirit',
    'familiar',
    'magic_weapon',
    'wisdom',
    'connection',
    'hide_object',
    'training',
    'spoofing',
    'other_name',
    'honor',
  ],

  // 種族選択肢データ
  speciesOptions: [
    { value: '', label: '選択してください', disabled: true },
    { value: 'human', label: '人間' },
    { value: 'elf', label: 'エルフ' },
    { value: 'dwarf', label: 'ドワーフ' },
    { value: 'halfling', label: 'ディグリング' },
    { value: 'therianthropy', label: '獣人' },
    { value: 'dragonfolk', label: '竜人' },
    { value: 'treefolk', label: 'ツリーフォーク' },
    { value: 'other', label: '希少人種' },
  ],

  // 武器選択肢データ
  weaponOptions: [
    { value: '', label: 'なし', description: null },
    { value: 'combat_small', label: '小型白兵武器', description: '（小型白兵武器）説明プレースホルダー' },
    { value: 'combat_medium', label: '中型白兵武器', description: '（中型白兵武器）説明プレースホルダー' },
    { value: 'combat_large', label: '大型白兵武器', description: '（大型白兵武器）説明プレースホルダー' },
    { value: 'shooting', label: '射撃武器', description: '（射撃武器）説明プレースホルダー' },
    { value: 'catalyst', label: '魔術触媒', description: '（魔術触媒）説明プレースホルダー' },
  ],

  // 防具選択肢データ
  armorOptions: [
    { value: '', label: 'なし', description: null },
    { value: 'light_armor', label: '軽装防具', description: '（軽装防具）説明プレースホルダー' },
    { value: 'heavy_armor', label: '重装防具', description: '（重装防具）説明プレースホルダー' },
  ],

  // 弱点獲得時期の初期選択肢
  weaknessAcquisitionOptions: [
    { value: '--', text: '--', disabled: false },
    { value: '作成時', text: '作成時', disabled: false },
  ],

  // 特技グループ選択肢
  specialSkillGroupOptions: [
    { value: '', label: '種類' },
    { value: 'tactics', label: '戦術' },
    { value: 'magic', label: '魔術' },
    { value: 'features', label: '特徴' },
    { value: 'free', label: '自由' },
  ],

  // 種族ラベルマップ
  speciesLabelMap: {
    human: '人間',
    elf: 'エルフ',
    dwarf: 'ドワーフ',
    halfling: 'ディグリング',
    therianthropy: '獣人',
    dragonfolk: '竜人',
    treefolk: 'ツリーフォーク',
    other: '希少人種',
    '': '未選択',
  },

  // 装備グループラベルマップ
  equipmentGroupLabelMap: {
    '': 'なし',
    combat_small: '小型白兵武器',
    combat_medium: '中型白兵武器',
    combat_large: '大型白兵武器',
    shooting: '射撃武器',
    catalyst: '魔術触媒',
    light_armor: '軽装防具',
    heavy_armor: '重装防具',
  },

  // 武器ダメージ
  weaponDamage: {
    '': '',
    combat_small: '1d4+1',
    combat_medium: '1d6+1',
    combat_large: '1d10',
    shooting: '1d8',
    catalyst: '',
  },

  // 重量データ
  equipmentWeights: {
    weapon: {
      '': 0,
      combat_small: 1,
      combat_medium: 3,
      combat_large: 5,
      shooting: 2,
      catalyst: 1,
    },
    armor: {
      '': 0,
      light_armor: 2,
      heavy_armor: 5,
    },
  },

  // キャラクターの初期データ構造
  defaultCharacterData: {
    images: [],
    name: '',
    playerName: '',
    species: '',
    rareSpecies: '',
    occupation: '',
    age: null,
    gender: '',
    height: '',
    weight: '',
    origin: '',
    faith: '',
    otherItems: '',
    currentScar: 0,
    initialScar: 0,
    linkCurrentToInitialScar: true,
    memo: '',
    weaknesses: null, // 実際の配列は初期化時に生成される
  },

  // 経験点計算の設定値
  experiencePointValues: {
    skillBase: 10, // 基本技能1つあたり
    expertSkill: 5, // 専門技能1つあたり
    specialSkill: 5, // 特技1つあたり
    weakness: 10, // 弱点1つあたり（作成時のみ）
    basePoints: 100, // 基本経験点
    maxInitialBonus: 20, // 初期ボーナスの上限
  },

  // プレースホルダーテキスト
  placeholderTexts: {
    expertSkill: '専門技能',
    expertSkillDisabled: '専門技能 (技能選択で有効)',
    weaponName: '装備名',
    armorName: '装備名',
    specialSkillNote: '詳細',
    characterMemo: 'キャラクター背景、設定、その他メモを記入',
  },

  // 設定値
  config: {
    initialSpecialSkillCount: 8,
    maxSpecialSkills: 20,
    maxWeaknesses: 10,
  },

  // ヘルプテキスト
  helpText: `#### 基本操作
- **データ保存**: 画面下部の「端末保存」ボタンで、入力内容をお使いの端末にファイル(.json または .zip)としてダウンロードできます。
- **データ読込**: 「読み込み」ボタンから、保存したファイルを選択してキャラクターデータを復元できます。
- **ココフォリア駒出力**: 「ココフォリア駒出力」ボタンをクリックすると、駒データがクリップボードにコピーされます。コピーされたデータをココフォリアのチャット欄に貼り付けるとキャラクター駒が作成されます。

#### Google Drive連携
- **サインイン**: 左上のクラウドアイコンから「キャラクターハブ」を開き、Googleアカウントでサインインできます。
- **保存と管理**: サインインすると、キャラクターハブ内でクラウド上のキャラクターデータを一覧表示し、「新規保存」「上書き保存」「削除」などが可能です。

#### 共有機能
- **共有リンク作成**: フッターの「共有」ボタンから、他の人とキャラクターデータを共有するためのリンクを作成できます。
- **スナップショット**: 作成した時点のキャラクターデータのコピーを共有します。
- **ライブリンク**: Google Driveに保存されたデータを常に参照するリンクを共有します。データを更新すると、共有相手が見る内容も更新されます。(要Google Drive連携)
- **オプション**: 共有リンクにはパスワードや有効期限を設定できます。「全文・画像を含める」オプションもGoogle Driveを利用します。

#### トラブルシューティング
- **Google Driveにサインインできない**: ポップアップブロック機能が有効な場合、認証画面が表示されないことがあります。ブラウザの設定で、このサイトのポップアップを許可してください。
- **ファイルが読み込めない**: ファイルが破損しているか、非対応の形式の可能性があります。本ツールの「データ保存」機能で保存したファイルをご利用ください。
- **共有リンクが開けない**: リンクの有効期限が切れているか、パスワードが間違っている可能性があります。リンクの作成者に確認してください。

#### 互換性とフィードバック
- bright-trpg様作成の「慈悲なきアイオニア　キャラクター作成用ツール」で保存されたJSONファイルも読み込み可能です。
- 不具合報告やご要望は、[GitHub Issues](https://github.com/ktakahiro1729/aioniacs/issues)までお寄せください。
  `,
};
