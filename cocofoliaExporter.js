class CocofoliaExporter {
  constructor() {
    this.MAX_MEMO_LENGTH = 200;
    this.BREAK_CHARS = ['\n', '。', '．'];
    this.MIN_BREAK_POSITION_RATIO = 0.5;
  }

  /**
   * 基本キャラクター情報を構築
   */
  buildCharacterBasicInfo(character, speciesLabelMap) {
    const lines = [];

    // 名前とプレイヤー名
    lines.push(`名前：${character.name || '名無し'}${character.playerName ? `（${character.playerName}）` : ""}`);

    // 種族情報
    const speciesText = speciesLabelMap[character.species] || character.species;
    const speciesDisplay = character.species === 'other'
      ? `${speciesText}（${character.rareSpecies || '未設定'}）`
      : speciesText;
    lines.push(`種族：${speciesDisplay}`);

    // その他基本情報
    if (character.gender) lines.push(`性別：${character.gender}`);
    if (character.age !== null) lines.push(`年齢：${character.age}`);
    if (character.origin) lines.push(`出身地：${character.origin}`);
    if (character.occupation) lines.push(`職業：${character.occupation}`);
    if (character.faith) lines.push(`信仰：${character.faith}`);
    if (character.height) lines.push(`身長：${character.height}`);
    if (character.weight) lines.push(`体重：${character.weight}`);

    return lines;
  }

  /**
   * 弱点情報を構築
   */
  buildWeaknessesInfo(weaknesses) {
    const weaknessList = [];

    weaknesses.forEach(w => {
      if (w.text && w.text.trim() !== '') {
        let acquiredText = '';
        if (w.acquired && w.acquired !== '--' && w.acquired !== 'help-text') {
          acquiredText = ` (${w.acquired})`;
        }
        weaknessList.push(`${w.text}${acquiredText}`);
      }
    });

    if (weaknessList.length > 0) {
      return ["\n【弱点】", ...weaknessList];
    }
    return [];
  }

  /**
   * 技能情報を構築
   */
  buildSkillsInfo(skills) {
    const skillLines = [];

    skills.forEach(skill => {
      if (skill.checked) {
        let skillLine = `・${skill.name}`;

        if (skill.canHaveExperts && skill.experts.some(e => e.value && e.value.trim() !== '')) {
          const expertTexts = skill.experts
            .filter(e => e.value && e.value.trim() !== '')
            .map(e => e.value);

          if (expertTexts.length > 0) {
            skillLine += ` (${expertTexts.join('/')})`;
          }
        }
        skillLines.push(skillLine);
      }
    });

    if (skillLines.length > 0) {
      return ["\n【技能】", ...skillLines];
    }
    return [];
  }

  /**
   * 特技情報を構築
   */
  buildSpecialSkillsInfo(specialSkills, specialSkillData, specialSkillsRequiringNote) {
    let specialSkillText = "";

    specialSkills.forEach(ss => {
      if (ss.group && ss.name) {
        const groupOptions = specialSkillData[ss.group] || [];
        const skillOption = groupOptions.find(opt => opt.value === ss.name);
        const skillLabel = skillOption ? skillOption.label : ss.name;

        if (specialSkillsRequiringNote.includes(ss.name) && ss.note) {
          specialSkillText += `《${skillLabel}：${ss.note}》`;
        } else {
          specialSkillText += `《${skillLabel}》`;
        }
      }
    });

    if (specialSkillText) {
      return ["\n【特技】", specialSkillText];
    }
    return [];
  }

  /**
   * 装備情報を構築
   */
  buildEquipmentInfo(equipments, equipmentGroupLabelMap) {
    const equipmentLines = [];

    // 武器1
    if (equipments.weapon1.group || equipments.weapon1.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.weapon1.group] || equipments.weapon1.group;
      equipmentLines.push(`${equipments.weapon1.name || '武器1'}（${groupLabel || '種別なし'}）`);
    }

    // 武器2
    if (equipments.weapon2.group || equipments.weapon2.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.weapon2.group] || equipments.weapon2.group;
      equipmentLines.push(`${equipments.weapon2.name || '武器2'}（${groupLabel || '種別なし'}）`);
    }

    // 防具
    if (equipments.armor.group || equipments.armor.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.armor.group] || equipments.armor.group;
      equipmentLines.push(`${equipments.armor.name || '防具'}（${groupLabel || '種別なし'}）`);
    }

    if (equipmentLines.length > 0) {
      return ["\n【武器・防具】", ...equipmentLines];
    }
    return [];
  }

  /**
   * その他所持品情報を構築
   */
  buildOtherItemsInfo(otherItems) {
    if (otherItems) {
      return ["\n【その他所持品】", otherItems];
    }
    return [];
  }

  /**
   * キャラクターメモを構築（長すぎる場合は切り詰め）
   */
  buildCharacterMemoInfo(memo) {
    if (!memo) {
      return [];
    }

    let truncatedMemo = "";

    if (memo.length <= this.MAX_MEMO_LENGTH) {
      truncatedMemo = memo;
    } else {
      truncatedMemo = this.truncateCharacterMemo(memo, this.MAX_MEMO_LENGTH);
    }

    return ["\n【キャラクターメモ】", truncatedMemo.trim()];
  }

  /**
   * キャラクターメモを適切な位置で切り詰める
   */
  truncateCharacterMemo(memo, maxLength) {
    const sub = memo.substring(0, maxLength);
    let lastBreak = -1;

    for (const char of this.BREAK_CHARS) {
      const idx = sub.lastIndexOf(char);
      if (idx > lastBreak && idx > maxLength * this.MIN_BREAK_POSITION_RATIO) {
        lastBreak = idx;
      }
    }

    if (lastBreak !== -1) {
      return memo.substring(0, lastBreak + 1) + (memo.length > lastBreak + 1 ? "…" : "");
    } else {
      return memo.substring(0, maxLength) + "…";
    }
  }

  /**
   * ココフォリア用のコマンドを構築
   */
  buildCocofoliaCommands(character, skills, equipments, weaponDamage) {
    const scar = Number(character.currentScar) || 0;
    let commands = `1d100>={ダメージ}+${scar} 〈ダメージチェック〉\n1d100>={ストレス} 〈ストレスチェック〉\n:傷痕=${scar}+{ダメージ}/2\n:ダメージ=0\n`;

    // 技能チェックコマンド
    skills.forEach(skill => {
      const dice = skill.checked ? "2d10" : "1d10";
      commands += `${dice} 〈${skill.name}〉\n`;

      // 専門技能コマンド
      if (skill.checked && skill.canHaveExperts) {
        skill.experts.forEach(expert => {
          if (expert.value && expert.value.trim() !== '') {
            commands += `3d10 〈${skill.name}：${expert.value}〉\n`;
          }
        });
      }
    });

    // 武器ダメージコマンド
    if (equipments.weapon1.group && weaponDamage[equipments.weapon1.group]) {
      commands += `${weaponDamage[equipments.weapon1.group]} 〈ダメージ判定（${equipments.weapon1.name || '武器1'}）〉\n`;
    }

    if (equipments.weapon2.group && weaponDamage[equipments.weapon2.group]) {
      commands += `${weaponDamage[equipments.weapon2.group]} 〈ダメージ判定（${equipments.weapon2.name || '武器2'}）〉\n`;
    }

    return commands.trim();
  }

  /**
   * ココフォリア用キャラクターオブジェクトを構築
   */
  buildCocofoliaCharacterObject(character, memo, commands, currentWeight) {
    const scar = Number(character.currentScar) || 0;
    const stress = 0;

    return {
      kind: "character",
      data: {
        params: [],
        status: [
          { label: "ダメージ", value: 0 },
          { label: "傷痕", value: scar },
          { label: "ストレス", value: stress }
        ],
        name: character.name || '名無し',
        initiative: currentWeight * -1,
        memo: memo,
        externalUrl: "",
        commands: commands
      }
    };
  }

  /**
   * メイン処理：ココフォリア形式のデータを生成
   */
  generateCocofoliaData(data) {
    const {
      character,
      skills,
      specialSkills,
      equipments,
      currentWeight,
      speciesLabelMap,
      equipmentGroupLabelMap,
      specialSkillData,
      specialSkillsRequiringNote,
      weaponDamage
    } = data;

    // 各セクションの情報を構築
    const memoSections = [
      ...this.buildCharacterBasicInfo(character, speciesLabelMap),
      ...this.buildWeaknessesInfo(character.weaknesses),
      ...this.buildSkillsInfo(skills),
      ...this.buildSpecialSkillsInfo(specialSkills, specialSkillData, specialSkillsRequiringNote),
      ...this.buildEquipmentInfo(equipments, equipmentGroupLabelMap),
      ...this.buildOtherItemsInfo(character.otherItems),
      ...this.buildCharacterMemoInfo(character.memo)
    ];

    const finalMemo = memoSections.join("\n").trim();

    const commands = this.buildCocofoliaCommands(character, skills, equipments, weaponDamage);

    const cocofoliaCharacter = this.buildCocofoliaCharacterObject(character, finalMemo, commands, currentWeight);

    return cocofoliaCharacter;
  }
}

window.CocofoliaExporter = CocofoliaExporter;