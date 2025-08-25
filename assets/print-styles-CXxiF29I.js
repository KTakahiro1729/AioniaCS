const n=`/* =================================================
   基本設定とページレイアウト
================================================= */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

@page {
  size: a4 portrait;
  margin: 0;
}

body {
  font-family: Arial, sans-serif;
  background: white;
  width: 794px;
  position: relative;
}

.page {
  width: 100%;
  height: 1123px;
  position: relative;
  page-break-after: always;
  overflow: hidden;
}

.page:last-child {
  page-break-after: auto;
}

/* =================================================
   ヘッダー部分のスタイル
================================================= */
.page-header {
  position: absolute;
  top: 8px;
  left: 34px;
  width: 726px;
  height: 68px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.page-header-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: 18pt;
  font-weight: 400;
  color: #000;
  text-align: center;
  word-spacing: 0.5em;
  margin-bottom: -4px;
  position: relative;
  z-index: 2;
}

/* ヘッダーのガイドライン */
.header-guideline {
  position: absolute;
  left: 53px;
  right: 53px;
  height: 0.5pt;
  background-color: #a6a6a6;
  z-index: 1;
}

.cap-line {
  top: 52px;
}

.base-line {
  top: 71px;

  /* 18.8mm ≈ 71px */
}

/* =================================================
   メインコンテナ
================================================= */
.main-container {
  position: absolute;
  top: 76px;
  left: 34px;
  width: 726px;
  height: 971px;
  border: 0.5pt solid #000;
  background: white;
  padding: 0 19px;
  overflow: visible;
}

/* =================================================
   サブコンテナの共通スタイル
================================================= */
.subcontainer {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 0.5pt solid #000;
  background: white;
}

.subcontainer:not(:last-child) {
  border-bottom: 0.5pt solid #000;
}

/* サブコンテナのヘッダー（左上の日本語ラベル） */
.subcontainer-header {
  font-family: 'Shippori Mincho', serif;
  font-weight: 700;
  font-size: 13pt;
  color: #000;
  margin-left: 5px;
  margin-top: 5px;
  align-self: flex-start;
}

/* サブコンテナのフッター（右下の英語ラベル） */
.subcontainer-footer {
  font-family: CarolinganMinuscules, serif;
  font-weight: 400;
  font-size: 14pt;
  color: #a6a6a6;
  margin: 0 -1px -7px 0;
  align-self: flex-end;
  margin-top: auto;
}

.writein-area {
  font-family: 'Zen Kurenaido', sans-serif;
  font-size: 15pt;
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 3px;
  white-space: pre-wrap;
  word-break: break-all;
}

/* テーブル用の新しいクラス */
td.writein-area {
  font-family: 'Zen Kurenaido', sans-serif;
  padding: 0;
  font-size: 15pt;
  display: table-cell;
  text-align: center;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* サブコンテナのコンテンツエリア */
.subcontainer-content {
  flex: 1;
  position: relative;
}

/* =================================================
   1ページ目の複雑なレイアウト
================================================= */
.page-1 .main-container {
  display: grid;
  grid-template-columns: 226px 1fr;
  grid-template-rows: 272px 98px 1fr 151px;
  gap: 0;
  padding: 0 19px;
}

/* 立ち絵エリア */
.portrait-area {
  grid-row: 1;
  grid-column: 1;
  border-right: 0.5pt solid #a6a6a6;
  border-bottom: 0.5pt solid #a6a6a6;
}

/* キャラクター情報エリア */
.character-info-area {
  grid-row: 1;
  grid-column: 2;
  border-bottom: 0.5pt solid #a6a6a6;
  display: flex;
  flex-direction: column;
}

.character-info-area .info-row {
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  flex-direction: row;
  position: relative;
  border-bottom: 0.5pt solid #a6a6a6;
}

.character-info-area .info-row:last-child {
  border-bottom: none;
}

.character-info-area .info-row.large {
  flex: 1.2;
}

.character-info-area .info-row.small {
  flex: 1;
}

/* ダメージ・傷跡・ストレス・経験点エリア */
.status-area {
  grid-row: 2;
  grid-column: 1 / 3;
  display: flex;
  border-top: 0.5pt solid #000;
  border-bottom: 0.5pt solid #000;
}

.scar-header {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
}

.scar-printed {
  font-family: 'Shippori Mincho', serif;
  font-size: 9pt;
  font-weight: 500;
  margin: 0 1px 1px 4px;
}

.scar-printed-value {
  font-family: 'Shippori Mincho', serif;
  font-size: 12pt;
}

.status-item {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 弱点・技能・特技エリア */
.skills-area {
  grid-row: 3;
  grid-column: 1 / 3;
  display: flex;
  border-bottom: 0.5pt solid #000;
}

.weakness-area {
  width: 378px;
  border-right: 0.5pt solid #a6a6a6;
  position: relative;
  display: flex;
  flex-direction: column;
}

.weakness-area .subcontainer-footer {
  margin-right: 7px;
}

.skill-ability-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-left: 8px;
}

.skill-area {
  flex: 1;
  border-bottom: 0.5pt solid #a6a6a6;
  position: relative;
  display: flex;
  flex-direction: column;
}

.ability-area {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 装備品エリア */
.equipment-area {
  grid-row: 4;
  grid-column: 1 / 3;
  position: relative;
  display: flex;
  flex-direction: column;

  /* 横並びに変更 */
}

/* 装備品のヘッダー（左側中央縦書き） */
.equipment-area .subcontainer-header {
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  text-orientation: upright;
  margin: 0;
  align-self: initial;
  width: 20px;
}

/* 装備品のコンテンツエリア */
.equipment-content {
  flex: 1;
  margin-left: 30px;
  padding: 4px 2px 0;
  display: flex;
}

/* 装備品リストエリア */
.equipment-list {
  flex: 1;
  margin-right: 10px;
}

/* 装備品の荷重エリア */
.equipment-weight {
  width: 132px;

  /* 3.5cm ≈ 132px */
  border-left: 0.5pt solid #a6a6a6;

  /* 灰色に変更 */
  padding-left: 5px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.equipment-weight-header {
  font-family: 'Shippori Mincho', serif;
  font-weight: 700;
  font-size: 14pt;
  color: #000;
  margin-left: 5px;
  margin-top: 5px;
}

.equipment-weight-content {
  flex: 1;
}

/* 装備品のテーブル */
.equipment-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Shippori Mincho', serif;
  font-size: 9pt;
}

.equipment-table thead th {
  font-weight: 400;
  text-align: left;
  padding: 2px 4px;
  border: none;
}

.equipment-table tbody td {
  height: 34px;
  border-bottom: 0.5pt solid #a6a6a6;
  padding-right: 3px;
  vertical-align: bottom;
}

.equipment-table tbody td.equipment-category {
  text-align: right;
  font-weight: 500;
}

/* 装備品の列幅 */
.col-equipment-category {
  width: 45px;
}

/* カテゴリ列 */
.col-equipment-type {
  width: 35%;
}

.col-equipment-detail {
  width: auto;
}

/* 弱点のテーブル */
.weakness-area .subcontainer-content {
  padding-right: 8px;
}

.weakness-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Shippori Mincho', serif;
  font-size: 9pt;
  margin-top: -13px;
}

.weakness-table thead th {
  font-weight: 400;
  text-align: left;
  border: none;
}

.weakness-table tbody td {
  padding: 0 4px;
  height: 38px;
  border-bottom: 0.5pt solid #a6a6a6;
  vertical-align: middle;
}

.weakness-table tbody td.number-cell {
  font-family: UnifrakturMaguntia, serif;
  vertical-align: bottom;
  text-align: center;
}

/* 弱点テーブルの列幅 */
.col-weakness-number {
  width: 38px;
  font-size: 20px;
}

.col-weakness-content {
  width: 226px;
}

.col-weakness-acquired {
  width: auto;
}

/* =================================================
   2ページ目の設定
================================================= */
.page-2 .main-container {
  display: flex;
  flex-direction: column;
}

.page-2 .subcontainer {
  margin: 0;
  border: none;
  border-bottom: 0.5pt solid #000;
}

.page-2 .subcontainer:last-child {
  border-bottom: none;
}

/* 第1サブコンテナ: その他の所持品 */
.inventory-container {
  height: 208px;
}

/* 第2サブコンテナ: キャラクターメモ */
.background-container {
  flex: 1;
}

/* 第3サブコンテナ: 冒険の記録 */
.adventure-container {
  height: 340px;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 冒険の記録のヘッダー（左側中央縦書き） */
.adventure-container .subcontainer-header {
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  text-orientation: upright;
  margin: 0;
  align-self: initial;
  width: 20px;
}

/* 冒険の記録のコンテンツエリア */
.adventure-content {
  flex: 1;
  margin-left: 30px;
  padding: 4px 5px 15px 2px;
}

/* 冒険の記録のテーブル */
.adventure-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Shippori Mincho', serif;
  font-size: 9pt;
}

/* 冒険の記録テーブルの列幅 */
.col-scenario {
  width: 25%;
}

.col-memo {
  width: 55%;
}

.col-spacer {
  width: 5%;
}

.col-experience {
  width: 15%;
}

.adventure-table thead th {
  font-weight: 400;
  text-align: left;
  padding: 2px 4px;
  border: none;
}

.adventure-table tbody td {
  height: 40px;
  border-bottom: 0.5pt solid #a6a6a6;
}

.adventure-table tbody td.spacer {
  border-bottom: none;
}

/* 情報行の分割レイアウト */
.info-row-split {
  display: flex;
  gap: 2px;
  height: 100%;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item-header {
  font-family: 'Shippori Mincho', serif;
  font-weight: 700;
  font-size: 9pt;
  color: #000;
  padding: 2px 3px 0;
  margin-bottom: -3px;
  margin-left: 5px;
  align-self: flex-start;
}

.info-item-content {
  flex: 1;
}

.info-item-footer {
  font-family: UnifrakturMaguntia, serif;
  font-weight: 400;
  font-size: 14pt;
  color: #000;
  margin-right: -1px;
  margin-bottom: -5px;
  align-self: flex-end;
}

.adventure-container .subcontainer-footer {
  margin-top: auto;
}

/* =================================================
   ページフッター
================================================= */
.page-footer {
  position: absolute;
  bottom: 38px;
  left: 34px;
  width: 726px;
  height: 38px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.page-footer-text {
  font-family: 'Shippori Mincho', serif;
  font-size: 9pt;
  color: #000;
  text-align: center;
  line-height: 1.2;
  margin: 0.5mm 0;
}

/* フッターのガイドライン */
.footer-guideline {
  position: absolute;
  left: 53px;
  right: 53px;
  height: 0.5pt;
  background-color: #a6a6a6;
}

.footer-baseline-1 {
  bottom: 59px;
}

.footer-baseline-2 {
  bottom: 41px;
}

.long-note {
  font-size: 13pt;
  justify-content: left;
  align-items: flex-start;
  padding: 4px;
  line-height: 1.1;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;export{n as default};
