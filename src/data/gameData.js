// Aionia RPG ゲームデータ
export const AioniaGameData = {
  // 特技データ
  specialSkillData: {
    tactics: [
      { value: 'concealed_weapon', label: '暗器' },
      { value: 'fence_off', label: '受け流し' },
      { value: 'covering_fire', label: '援護射撃' },
      { value: 'stance', label: '構え' },
      { value: 'riding_combat', label: '騎乗戦闘' },
      { value: 'fatal_spot_attack', label: '急所の一撃' },
      { value: 'high_angle_fire', label: '曲射' },
      { value: 'ready_to_die', label: '決死の覚悟' },
      { value: 'martial_arts', label: '拳闘術' },
      { value: 'escort', label: '護衛' },
      { value: 'heavy_attack', label: '重撃' },
      { value: 'risk_attack', label: '捨て身の一撃' },
      { value: 'machine_gunning', label: '掃射' },
      { value: 'snipe', label: '狙撃' },
      { value: 'provoke', label: '挑発' },
      { value: 'lightning_speed', label: '電光石火' },
      { value: 'rush', label: '突撃' },
      { value: 'cleave', label: '凪払い' },
      { value: 'knock_shooting', label: '弾き落とし' },
      { value: 'parry', label: 'パリィ' },
      { value: 'feint', label: 'フェイント' },
      { value: 'throw_weapon', label: '武器投げの習熟' },
      { value: 'break_weapon', label: '武器破壊' },
      { value: 'fortitude', label: '不屈' },
      { value: 'gait', label: '歩法' },
      { value: 'anticipate', label: '見切り' },
      { value: 'pierce_armor', label: '鎧通し' },
    ],
    magic: [
      { value: 'light', label: '灯り' },
      { value: 'dozing', label: '居眠り' },
      { value: 'enchant', label: 'エンチャント' },
      { value: 'send_sound', label: '音送り' },
      { value: 'silence', label: '音消し' },
      { value: 'recovery', label: '回復' },
      { value: 'read_wind', label: '風読み' },
      { value: 'activate', label: '活性' },
      { value: 'fear', label: '恐怖' },
      { value: 'warning', label: '警報' },
      { value: 'barrier', label: '結界' },
      { value: 'illusion', label: '幻影' },
      { value: 'telecommunication', label: '交信' },
      { value: 'power_of_word', label: '言霊' },
      { value: 'ritual_of_spirit', label: '死儀' },
      { value: 'heal', label: '治癒' },
      { value: 'calling', label: '通話' },
      { value: 'familiar', label: '使い魔' },
      { value: 'ignite', label: '点火' },
      { value: 'extend_magic', label: '範囲魔術' },
      { value: 'light_brush', label: '光の筆' },
      { value: 'cover', label: '被覆' },
      { value: 'float', label: '浮遊' },
      { value: 'magic_weapon', label: '魔術の得物' },
    ],
    features: [
      { value: 'wisdom', label: '叡智' },
      { value: 'concentrate', label: '過集中' },
      { value: 'acrobatics', label: '軽業' },
      { value: 'connivance', label: '看破' },
      { value: 'thin', label: '希薄' },
      { value: 'cajolery', label: '口車' },
      { value: 'connection', label: 'コネクション' },
      { value: 'change_clothes', label: '様変わりの衣' },
      { value: 'hide_object', label: '仕込み' },
      { value: 'auto_writing', label: '自動筆記具' },
      { value: 'pickpocket', label: 'スリの極意' },
      { value: 'instant', label: '即席' },
      { value: 'infinite_bagpack', label: '底なしの鞄' },
      { value: 'training', label: '調教' },
      { value: 'instruction', label: '伝授' },
      { value: 'cleverness', label: '天性の小手先' },
      { value: 'adaptability', label: '踏破' },
      { value: 'cipher', label: '独自暗号' },
      { value: 'spoofing', label: 'なりすまし' },
      { value: 'beauty', label: '美貌' },
      { value: 'other_name', label: '二つ名' },
      { value: 'decompose', label: '分解' },
      { value: 'honor', label: '誉れ' },
      { value: 'night_vision', label: '夜目' },
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
    { value: '', label: 'なし' },
    { value: 'combat_small', label: '小型白兵武器' },
    { value: 'combat_medium', label: '中型白兵武器' },
    { value: 'combat_large', label: '大型白兵武器' },
    { value: 'shooting', label: '射撃武器' },
    { value: 'catalyst', label: '魔術触媒' },
  ],

  // 防具選択肢データ
  armorOptions: [
    { value: '', label: 'なし' },
    { value: 'light_armor', label: '軽装防具' },
    { value: 'heavy_armor', label: '重装防具' },
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
