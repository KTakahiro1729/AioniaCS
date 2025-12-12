import commandTemplateRaw from '@/contents/cocofolia/command_template.txt?raw';
import memoTemplateRaw from '@/contents/cocofolia/memo_template.txt?raw';

/**
 * ココフォリア出力機能を管理するクラス
 */
export class CocofoliaExporter {
  constructor() {
    this.MAX_MEMO_LENGTH = 200;
    this.BREAK_CHARS = ['\n', '。', '．'];
    this.MIN_BREAK_POSITION_RATIO = 0.5;
    this.defaults = {
      characterName: '名もなき冒険者',
      weapon1: '武器1',
      weapon2: '武器2',
      armor: '防具',
      groupLabel: '種別なし',
    };
    this.statusLabels = {
      damage: 'ダメージ',
      scar: '傷痕',
      stress: 'ストレス',
    };
  }

  normalizeWhitespace(text) {
    const lines = text.split('\n').map((line) => line.replace(/\s+$/u, ''));
    const compacted = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed === '' && compacted[compacted.length - 1]?.trim() === '') {
        return;
      }
      compacted.push(line);
    });
    while (compacted.length && compacted[0].trim() === '') compacted.shift();
    while (compacted.length && compacted[compacted.length - 1].trim() === '') compacted.pop();
    return compacted.join('\n');
  }

  parseTemplate(template) {
    const root = { type: 'fragment', children: [] };
    const stack = [root];

    const pushText = (text) => {
      if (text) {
        stack[stack.length - 1].children.push({ type: 'text', value: text });
      }
    };

    let index = 0;
    while (index < template.length) {
      const nextOpen = template.indexOf('[', index);
      const nextClose = template.indexOf(']', index);

      if (nextClose !== -1 && (nextOpen === -1 || nextClose < nextOpen)) {
        pushText(template.slice(index, nextClose));
        const top = stack[stack.length - 1];
        if (top.type === 'conditional') {
          stack.pop();
        } else {
          stack[stack.length - 1].children.push({ type: 'text', value: ']' });
        }
        index = nextClose + 1;
        continue;
      }

      if (nextOpen === -1) {
        pushText(template.slice(index));
        break;
      }

      pushText(template.slice(index, nextOpen));
      if (template.startsWith('[#', nextOpen)) {
        const end = template.indexOf(']', nextOpen);
        const key = template.slice(nextOpen + 2, end).trim();
        const node = { type: 'loop', key, children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
        index = end + 1;
        continue;
      }

      if (template.startsWith('[/', nextOpen)) {
        const end = template.indexOf(']', nextOpen);
        const key = template.slice(nextOpen + 2, end).trim();
        const top = stack[stack.length - 1];
        if (top.type === 'loop' && top.key === key) {
          stack.pop();
        } else {
          throw new Error(`Mismatched closing tag. Expected '${top.key}' but got '${key}'.`);
        }
        index = end + 1;
        continue;
      }

      if (template.startsWith('[?', nextOpen)) {
        const node = { type: 'conditional', children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
        index = nextOpen + 2;
        continue;
      }

      const end = template.indexOf(']', nextOpen);
      const key = template.slice(nextOpen + 1, end).trim();
      stack[stack.length - 1].children.push({ type: 'variable', key });
      index = end + 1;
    }

    return root;
  }

  resolveRawValue(context, key) {
    return context?.[key];
  }

  stringifyValue(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    return String(value);
  }

  mergeContext(context, item) {
    if (item && typeof item === 'object') {
      return { ...context, ...item };
    }
    return { ...context, value: item };
  }

  collectValues(nodes, context) {
    const values = [];
    nodes.forEach((node) => {
      if (node.type === 'variable') {
        values.push(this.resolveRawValue(context, node.key));
      } else if (node.type === 'loop') {
        const items = this.resolveRawValue(context, node.key);
        if (Array.isArray(items)) {
          items.forEach((item) => {
            values.push(...this.collectValues(node.children, this.mergeContext(context, item)));
          });
        }
      } else if (node.type === 'conditional' || node.type === 'fragment') {
        values.push(...this.collectValues(node.children, context));
      }
    });
    return values;
  }

  renderNodes(nodes, context) {
    return nodes.map((node) => this.renderNode(node, context)).join('');
  }

  isEmptyValue(value) {
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || String(value).trim() === '';
  }

  renderNode(node, context) {
    switch (node.type) {
      case 'text':
        return node.value;
      case 'variable':
        return this.stringifyValue(this.resolveRawValue(context, node.key));
      case 'loop': {
        const items = this.resolveRawValue(context, node.key);
        if (!Array.isArray(items) || items.length === 0) return '';
        return items.map((item) => this.renderNodes(node.children, this.mergeContext(context, item))).join('');
      }
      case 'conditional': {
        const values = this.collectValues(node.children, context);
        if (values.every((val) => this.isEmptyValue(val))) {
          return '';
        }
        return this.renderNodes(node.children, context);
      }
      default:
        return '';
    }
  }

  render(template, data) {
    const ast = this.parseTemplate(template);
    const rendered = this.renderNodes(ast.children, data || {});
    return this.normalizeWhitespace(rendered);
  }

  buildCharacterBasicInfo(character, speciesLabelMap) {
    const lines = [];
    const displayName = character.name || this.defaults.characterName;
    const playerSuffix = character.playerName ? `（${character.playerName}）` : '';
    lines.push(`名前：${displayName}${playerSuffix}`);

    const speciesText = speciesLabelMap[character.species] || character.species;
    const speciesDisplay = character.species === 'other' ? `${speciesText}（${character.rareSpecies || '未設定'}）` : speciesText;
    lines.push(`種族：${speciesDisplay}`);

    if (character.gender) lines.push(`性別：${character.gender}`);
    if (character.age !== null && character.age !== undefined) lines.push(`年齢：${character.age}`);
    if (character.origin) lines.push(`出身地：${character.origin}`);
    if (character.occupation) lines.push(`職業：${character.occupation}`);
    if (character.faith) lines.push(`信仰：${character.faith}`);
    if (character.height) lines.push(`身長：${character.height}`);
    if (character.weight) lines.push(`体重：${character.weight}`);

    return lines;
  }

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

  buildSkillsInfo(skills) {
    const skillTexts = [];

    skills.forEach((skill) => {
      if (skill.checked) {
        let skillText = `〈${skill.name}〉`;

        if (skill.canHaveExperts && skill.experts.some((e) => e.value && e.value.trim() !== '')) {
          const expertTexts = skill.experts.filter((e) => e.value && e.value.trim() !== '').map((e) => e.value);

          if (expertTexts.length > 0) {
            skillText = `〈${skill.name}：${expertTexts.join('/')}〉`;
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

  buildSpecialSkillsInfo(specialSkills, specialSkillData, specialSkillsRequiringNote) {
    let specialSkillText = '';

    specialSkills.forEach((ss) => {
      if (ss.group && ss.name) {
        const groupOptions = specialSkillData[ss.group] || [];
        const skillOption = groupOptions.find((opt) => opt.value === ss.name);
        const skillLabel = skillOption ? skillOption.label : ss.name;

        if (specialSkillsRequiringNote.includes(ss.name) && ss.note) {
          specialSkillText += `《${skillLabel}：${ss.note}》`;
        } else {
          specialSkillText += `《${skillLabel}》`;
        }
      }
    });

    if (specialSkillText) {
      return specialSkillText;
    }
    return '';
  }

  buildEquipmentInfo(equipments, equipmentGroupLabelMap) {
    const equipmentLines = [];

    if (equipments.weapon1.group || equipments.weapon1.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.weapon1.group] || equipments.weapon1.group || this.defaults.groupLabel;
      const name = equipments.weapon1.name || this.defaults.weapon1;
      equipmentLines.push(`${name}（${groupLabel}）`);
    }

    if (equipments.weapon2.group || equipments.weapon2.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.weapon2.group] || equipments.weapon2.group || this.defaults.groupLabel;
      const name = equipments.weapon2.name || this.defaults.weapon2;
      equipmentLines.push(`${name}（${groupLabel}）`);
    }

    if (equipments.armor.group || equipments.armor.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.armor.group] || equipments.armor.group || this.defaults.groupLabel;
      const name = equipments.armor.name || this.defaults.armor;
      equipmentLines.push(`${name}（${groupLabel}）`);
    }

    if (equipmentLines.length > 0) {
      return equipmentLines.join('\n');
    }
    return '';
  }

  buildOtherItemsInfo(otherItems) {
    if (otherItems) {
      return otherItems;
    }
    return '';
  }

  buildCharacterMemoInfo(memo) {
    if (!memo) {
      return '';
    }

    let truncatedMemo = '';

    if (memo.length <= this.MAX_MEMO_LENGTH) {
      truncatedMemo = memo;
    } else {
      truncatedMemo = this.truncateCharacterMemo(memo, this.MAX_MEMO_LENGTH);
    }

    return truncatedMemo.trim();
  }

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

  buildCocofoliaCommands(skills, equipments, weaponDamage) {
    const baseCommands = [
      '1d100>={damage}+{scar} 〈ダメージチェック〉',
      '1d100>={stress} 〈ストレスチェック〉',
      ':傷痕={scar}+{damage}/2 〈治癒①〉',
      ':ダメージ=0                 〈治癒②〉',
    ];

    const skillCommands = [];

    skills.forEach((skill) => {
      const dice = skill.checked ? '2d10' : '1d10';
      skillCommands.push(`${dice} 〈${skill.name}〉`);

      if (skill.name === '防御') {
        skillCommands.push(`${dice} 〈${skill.name}（防具なし）〉`);
        skillCommands.push(`${dice}+2 〈${skill.name}（防具あり）〉`);
      }

      if (skill.checked && skill.canHaveExperts) {
        skill.experts.forEach((expert) => {
          if (expert.value && expert.value.trim() !== '') {
            skillCommands.push(`3d10 〈${skill.name}：${expert.value}〉`);
          }
        });
      }
    });

    const weaponCommands = [];

    if (equipments.weapon1.group && weaponDamage[equipments.weapon1.group]) {
      const weaponName = equipments.weapon1.name || this.defaults.weapon1;
      weaponCommands.push(`${weaponDamage[equipments.weapon1.group]} 〈ダメージ判定（${weaponName}）〉`);
    }

    if (equipments.weapon2.group && weaponDamage[equipments.weapon2.group]) {
      const weaponName = equipments.weapon2.name || this.defaults.weapon2;
      weaponCommands.push(`${weaponDamage[equipments.weapon2.group]} 〈ダメージ判定（${weaponName}）〉`);
    }

    return { baseCommands, skillCommands, weaponCommands };
  }

  prepareViewData(data) {
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

    const memoSections = {
      basicInfo: this.buildCharacterBasicInfo(character, speciesLabelMap).join('\n'),
      weaknesses: this.buildWeaknessesInfo(character.weaknesses),
      skills: this.buildSkillsInfo(skills),
      specialSkills: this.buildSpecialSkillsInfo(specialSkills, specialSkillData, specialSkillsRequiringNote),
      equipment: this.buildEquipmentInfo(equipments, equipmentGroupLabelMap),
      otherItems: this.buildOtherItemsInfo(character.otherItems),
      memo: this.buildCharacterMemoInfo(character.memo),
    };

    const { baseCommands, skillCommands, weaponCommands } = this.buildCocofoliaCommands(skills, equipments, weaponDamage);

    return {
      memoData: memoSections,
      commandData: {
        baseCommands: baseCommands.map((line) => ({ line })),
        skillCommands: skillCommands.map((line) => ({ line })),
        weaponCommands: weaponCommands.map((line) => ({ line })),
      },
      displayName: character.name || this.defaults.characterName,
      statusValues: {
        damage: 0,
        scar: Number(character.currentScar) || 0,
        stress: 0,
      },
      initiative: currentWeight * -1,
    };
  }

  buildCocofoliaCharacterObject(displayName, memo, commands, statusValues, initiative) {
    return {
      kind: 'character',
      data: {
        params: [],
        status: [
          { label: this.statusLabels.damage, value: statusValues.damage },
          { label: this.statusLabels.scar, value: statusValues.scar },
          { label: this.statusLabels.stress, value: statusValues.stress },
        ],
        name: displayName,
        initiative,
        memo,
        externalUrl: '',
        commands,
      },
    };
  }

  generateCocofoliaData(data) {
    const viewData = this.prepareViewData(data);
    const memo = this.render(memoTemplateRaw, viewData.memoData);
    const commands = this.render(commandTemplateRaw, viewData.commandData);

    return this.buildCocofoliaCharacterObject(viewData.displayName, memo, commands, viewData.statusValues, viewData.initiative);
  }
}

window.CocofoliaExporter = CocofoliaExporter;
