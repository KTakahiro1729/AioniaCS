import commandsBaseRaw from '@/contents/cocofolia/commands_base.txt?raw';
import patternsCsv from '@/contents/cocofolia/patterns.csv?raw';
import { interpolate, parseCsv } from '@/i18n/loader.js';

/**
 * ココフォリア出力機能を管理するクラス
 */
export class CocofoliaExporter {
  constructor() {
    this.templates = parseCsv(patternsCsv).records;
    this.BREAK_CHARS = ['\n', '。', '．'];
    this.MIN_BREAK_POSITION_RATIO = 0.5;
    this.defaults = {
      characterName: this.getTemplate('default.character_name') || '名もなき冒険者',
      weapon1: this.getTemplate('default.weapon1') || '武器1',
      weapon2: this.getTemplate('default.weapon2') || '武器2',
      armor: this.getTemplate('default.armor') || '防具',
      groupLabel: this.getTemplate('default.group_label') || '種別なし',
    };
  }

  getTemplate(key) {
    return this.templates[key]?.template ?? '';
  }

  format(key, variables) {
    return interpolate(this.getTemplate(key), variables);
  }

  /**
   * 基本キャラクター情報を構築
   */
  buildCharacterBasicInfo(character, speciesLabelMap) {
    const lines = [];
    const displayName = character.name || this.defaults.characterName;
    const playerSuffix = character.playerName ? this.format('line.player_suffix', { player: character.playerName }) : '';
    lines.push(this.format('line.name', { name: displayName, player_suffix: playerSuffix }));

    if (character.species) {
      const speciesText = speciesLabelMap[character.species] || character.species;
      const speciesDisplay = character.species === 'other' ? `${speciesText}（${character.rareSpecies || '未設定'}）` : speciesText;
      lines.push(this.format('line.species', { species: speciesDisplay }));
    }
    if (character.occupation) lines.push(this.format('line.occupation', { occupation: character.occupation }));

    if (character.gender) lines.push(this.format('line.gender', { gender: character.gender }));
    if (character.age !== null) lines.push(this.format('line.age', { age: character.age }));
    if (character.build) lines.push(this.format('line.build', { build: character.build }));

    return lines;
  }

  /**
   * 弱点情報を構築
   */
  buildWeaknessesInfo(weaknesses) {
    const weaknessList = [];

    weaknesses.forEach((w) => {
      if (w.text && w.text.trim() !== '') {
        weaknessList.push(w.text);
      }
    });

    if (weaknessList.length > 0) {
      return weaknessList.join('\n');
    }
    return '';
  }

  /**
   * 技能情報を構築
   */
  buildSkillsInfo(skills) {
    const skillTexts = [];

    skills.forEach((skill) => {
      if (skill.checked) {
        let skillText = this.format('memo.skill_entry', { name: skill.name });

        if (skill.canHaveExperts && skill.experts.some((e) => e.value && e.value.trim() !== '')) {
          const expertTexts = skill.experts.filter((e) => e.value && e.value.trim() !== '').map((e) => e.value);

          if (expertTexts.length > 0) {
            skillText = this.format('memo.skill_expert_entry', {
              name: skill.name,
              expert: expertTexts.join('/'),
            });
          }
        }
        skillTexts.push(skillText);
      }
    });

    if (skillTexts.length > 0) {
      return skillTexts.join(' ');
    }
    return '';
  }

  /**
   * 特技情報を構築
   */
  buildSpecialSkillsInfo(specialSkills, specialSkillData, specialSkillsRequiringNote) {
    let specialSkillText = '';

    specialSkills.forEach((ss) => {
      if (ss.group && ss.name) {
        const groupOptions = specialSkillData[ss.group] || [];
        const skillOption = groupOptions.find((opt) => opt.value === ss.name);
        const skillLabel = skillOption ? skillOption.label : ss.name;

        if (specialSkillsRequiringNote.includes(ss.name) && ss.note) {
          specialSkillText += this.format('special_skill.with_note', { name: skillLabel, note: ss.note });
        } else {
          specialSkillText += this.format('special_skill.basic', { name: skillLabel });
        }
      }
    });

    if (specialSkillText) {
      return specialSkillText;
    }
    return '';
  }

  /**
   * 装備情報を構築
   */
  buildEquipmentInfo(equipments, equipmentGroupLabelMap) {
    const equipmentLines = [];

    if (equipments.weapon1.group || equipments.weapon1.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.weapon1.group] || equipments.weapon1.group || this.defaults.groupLabel;
      const name = equipments.weapon1.name || this.defaults.weapon1;
      equipmentLines.push(this.format('line.equipment_item', { name, group: groupLabel }));
    }

    if (equipments.weapon2.group || equipments.weapon2.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.weapon2.group] || equipments.weapon2.group || this.defaults.groupLabel;
      const name = equipments.weapon2.name || this.defaults.weapon2;
      equipmentLines.push(this.format('line.equipment_item', { name, group: groupLabel }));
    }

    if (equipments.armor.group || equipments.armor.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.armor.group] || equipments.armor.group || this.defaults.groupLabel;
      const name = equipments.armor.name || this.defaults.armor;
      equipmentLines.push(this.format('line.equipment_item', { name, group: groupLabel }));
    }

    if (equipmentLines.length > 0) {
      return equipmentLines.join('\n');
    }
    return '';
  }

  /**
   * その他所持品情報を構築
   */
  buildOtherItemsInfo(otherItems) {
    if (otherItems) {
      return otherItems;
    }
    return '';
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
      return memo.substring(0, lastBreak + 1) + (memo.length > lastBreak + 1 ? '…' : '');
    } else {
      return memo.substring(0, maxLength) + '…';
    }
  }

  /**
   * ココフォリア用のコマンドを構築
   */
  buildCocofoliaCommands(character, skills, equipments, weaponDamage) {
    const commandLines = commandsBaseRaw.trim().split('\n');

    skills.forEach((skill) => {
      const dice = skill.checked ? '2d10' : '1d10';

      if (skill.name === '防御') {
        commandLines.push(this.format('command.skill_defense_no_armor', { dice, name: skill.name }));
        commandLines.push(this.format('command.skill_defense_with_armor', { dice, name: skill.name }));
      } else {
        commandLines.push(this.format('command.skill', { dice, name: skill.name }));
      }

      if (skill.checked && skill.canHaveExperts) {
        skill.experts.forEach((expert) => {
          if (expert.value && expert.value.trim() !== '') {
            commandLines.push(this.format('command.skill_expert', { name: skill.name, expert: expert.value }));
          }
        });
      }
    });

    if (equipments.weapon1.group && weaponDamage[equipments.weapon1.group]) {
      const weaponName = equipments.weapon1.name || this.defaults.weapon1;
      commandLines.push(
        this.format('command.weapon_damage', {
          formula: weaponDamage[equipments.weapon1.group],
          weapon_name: weaponName,
        }),
      );
    }

    if (equipments.weapon2.group && weaponDamage[equipments.weapon2.group]) {
      const weaponName = equipments.weapon2.name || this.defaults.weapon2;
      commandLines.push(
        this.format('command.weapon_damage', {
          formula: weaponDamage[equipments.weapon2.group],
          weapon_name: weaponName,
        }),
      );
    }

    return commandLines.join('\n').trim();
  }

  /**
   * ココフォリア用キャラクターオブジェクトを構築
   */
  buildCocofoliaCharacterObject(character, memo, commands, currentWeight) {
    const scar = Number(character.currentScar) || 0;
    const stress = 0;

    return {
      kind: 'character',
      data: {
        params: [],
        status: [
          { label: this.getTemplate('status.damage') || 'ダメージ', value: 0 },
          { label: this.getTemplate('status.scar') || '傷痕', value: scar },
          { label: this.getTemplate('status.stress') || 'ストレス', value: stress },
        ],
        name: character.name || this.defaults.characterName,
        initiative: currentWeight,
        memo: memo,
        externalUrl: '',
        commands: commands,
      },
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
      weaponDamage,
    } = data;

    // 各セクションの定義
    const sections = [
      {
        headerKey: null, // 基本情報はヘッダーなし
        content: this.buildCharacterBasicInfo(character, speciesLabelMap).join('\n'),
      },
      {
        headerKey: 'heading.weakness',
        content: this.buildWeaknessesInfo(character.weaknesses),
      },
      {
        headerKey: 'heading.skills',
        content: this.buildSkillsInfo(skills),
      },
      {
        headerKey: 'heading.special_skills',
        content: this.buildSpecialSkillsInfo(specialSkills, specialSkillData, specialSkillsRequiringNote),
      },
      {
        headerKey: 'heading.equipment',
        content: this.buildEquipmentInfo(equipments, equipmentGroupLabelMap),
      },
      {
        headerKey: 'heading.other_items',
        content: this.buildOtherItemsInfo(character.otherItems),
      },
    ];

    const finalMemo = sections
      .filter((section) => section.content && section.content.trim() !== '')
      .map((section) => {
        const header = section.headerKey ? this.getTemplate(section.headerKey) : '';
        return header ? `${header}\n${section.content}` : section.content;
      })
      .join('\n\n')
      .trim();

    const commands = this.buildCocofoliaCommands(character, skills, equipments, weaponDamage);

    const cocofoliaCharacter = this.buildCocofoliaCharacterObject(character, finalMemo, commands, currentWeight);

    return cocofoliaCharacter;
  }
}

window.CocofoliaExporter = CocofoliaExporter;
