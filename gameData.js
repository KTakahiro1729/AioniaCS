// Aionia RPG ゲームデータ
window.AioniaGameData = {
  // 特技データ
  specialSkillData: {
    tactics: [
      { value: "concealed_weapon", label: "暗器" },
      { value: "fence_off", label: "受け流し" },
      { value: "covering_fire", label: "援護射撃" },
      { value: "stance", label: "構え" },
      { value: "riding_combat", label: "騎乗戦闘" },
      { value: "fatal_spot_attack", label: "急所の一撃" },
      { value: "high_angle_fire", label: "曲射" },
      { value: "ready_to_die", label: "決死の覚悟" },
      { value: "martial_arts", label: "拳闘術" },
      { value: "escort", label: "護衛" },
      { value: "heavy_attack", label: "重撃" },
      { value: "risk_attack", label: "捨て身の一撃" },
      { value: "machine_gunning", label: "掃射" },
      { value: "snipe", label: "狙撃" },
      { value: "provoke", label: "挑発" },
      { value: "lightning_speed", label: "電光石火" },
      { value: "rush", label: "突撃" },
      { value: "cleave", label: "凪払い" },
      { value: "knock_shooting", label: "弾き落とし" },
      { value: "parry", label: "パリィ" },
      { value: "feint", label: "フェイント" },
      { value: "throw_weapon", label: "武器投げの習熟" },
      { value: "break_weapon", label: "武器破壊" },
      { value: "fortitude", label: "不屈" },
      { value: "gait", label: "歩法" },
      { value: "anticipate", label: "見切り" },
      { value: "pierce_armor", label: "鎧通し" }
    ],
    magic: [
      { value: "light", label: "灯り" },
      { value: "dozing", label: "居眠り" },
      { value: "enchant", label: "エンチャント" },
      { value: "send_sound", label: "音送り" },
      { value: "silence", label: "音消し" },
      { value: "recovery", label: "回復" },
      { value: "read_wind", label: "風読み" },
      { value: "activate", label: "活性" },
      { value: "fear", label: "恐怖" },
      { value: "warning", label: "警報" },
      { value: "barrier", label: "結界" },
      { value: "illusion", label: "幻影" },
      { value: "telecommunication", label: "交信" },
      { value: "power_of_word", label: "言霊" },
      { value: "ritual_of_spirit", label: "死儀" },
      { value: "heal", label: "治癒" },
      { value: "calling", label: "通話" },
      { value: "familiar", label: "使い魔" },
      { value: "ignite", label: "点火" },
      { value: "extend_magic", label: "範囲魔術" },
      { value: "light_brush", label: "光の筆" },
      { value: "cover", label: "被覆" },
      { value: "float", label: "浮遊" },
      { value: "magic_weapon", label: "魔術の得物" }
    ],
    features: [
      { value: "wisdom", label: "叡智" },
      { value: "concentrate", label: "過集中" },
      { value: "acrobatics", label: "軽業" },
      { value: "connivance", label: "看破" },
      { value: "thin", label: "希薄" },
      { value: "cajolery", label: "口車" },
      { value: "connection", label: "コネクション" },
      { value: "change_clothes", label: "様変わりの衣" },
      { value: "hide_object", label: "仕込み" },
      { value: "auto_writing", label: "自動筆記具" },
      { value: "pickpocket", label: "スリの極意" },
      { value: "instant", label: "即席" },
      { value: "infinite_bagpack", label: "底なしの鞄" },
      { value: "training", label: "調教" },
      { value: "instruction", label: "伝授" },
      { value: "cleverness", label: "天性の小手先" },
      { value: "adaptability", label: "踏破" },
      { value: "cipher", label: "独自暗号" },
      { value: "spoofing", label: "なりすまし" },
      { value: "beauty", label: "美貌" },
      { value: "other_name", label: "二つ名" },
      { value: "decompose", label: "分解" },
      { value: "honor", label: "誉れ" },
      { value: "night_vision", label: "夜目" }
    ]
  },

  // 基本技能定義
  baseSkills: [
    { id: 'motion', name: '運動', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
    { id: 'avoidance', name: '回避', checked: false, canHaveExperts: false, experts: [] },
    { id: 'sense', name: '感覚', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
    { id: 'observation', name: '観察', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
    { id: 'technique', name: '技巧', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
    { id: 'shooting', name: '射撃', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
    { id: 'sociality', name: '社交', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
    { id: 'knowledge', name: '知識', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
    { id: 'combat', name: '白兵', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
    { id: 'defense', name: '防御', checked: false, canHaveExperts: false, experts: [] }
  ],

  // 特技の順序
  externalSkillOrder: ['motion', 'avoidance', 'sense', 'observation', 'technique', 'shooting', 'sociality', 'knowledge', 'combat', 'defense'],

  // 備考が必要な特技
  specialSkillsRequiringNote: [
    "enchant", "ritual_of_spirit", "familiar", "magic_weapon", "wisdom",
    "connection", "hide_object", "training", "spoofing", "other_name", "honor"
  ],

  // 種族ラベルマップ
  speciesLabelMap: {
    "human": "人間",
    "elf": "エルフ",
    "dwarf": "ドワーフ",
    "halfling": "ディグリング",
    "therianthropy": "獣人",
    "dragonfolk": "竜人",
    "treefolk": "ツリーフォーク",
    "other": "希少人種",
    "": "未選択"
  },

  // 装備グループラベルマップ
  equipmentGroupLabelMap: {
    "": "なし",
    "combat_small": "小型白兵武器",
    "combat_medium": "中型白兵武器",
    "combat_large": "大型白兵武器",
    "shooting": "射撃武器",
    "catalyst": "魔術触媒",
    "light_armor": "軽装防具",
    "heavy_armor": "重装防具"
  },

  // 武器ダメージ
  weaponDamage: {
    "": "",
    "combat_small": "1d4+1",
    "combat_medium": "1d6+1",
    "combat_large": "1d10",
    "shooting": "1d8",
    "catalyst": ""
  },

  // 設定値
  config: {
    initialSpecialSkillCount: 8,
    maxSpecialSkills: 20,
    maxWeaknesses: 10
  },

  // ヘルプテキスト
  helpText: `
      <h4>使い方</h4>
      <ul>
          <li>「データ保存」ボタンで、入力内容をダウンロードできます。</li>
          <li>「データ読込」ボタンで、保存したファイルを読み込めます。</li>
          <li>「ココフォリア駒出力」ボタンをクリックすると、駒データがクリップボードにコピーされます。</li>
          <li>コピーされたデータをココフォリアのチャット欄に貼り付けることで、キャラクター駒を作成できます。</li>
      </ul>
      <h4>注意点</h4>
      <ul>
          <li>このツールはブラウザ上で動作し、入力データはサーバーには保存されません。定期的なデータ保存を推奨します。</li>
      </ul>
  `
};