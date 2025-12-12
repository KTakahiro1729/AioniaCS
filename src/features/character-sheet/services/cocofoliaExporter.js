import commandTemplateRaw from '@/contents/cocofolia/command_template.txt?raw';
import memoTemplateRaw from '@/contents/cocofolia/memo_template.txt?raw';

/**
 * ココフォリア出力機能を管理するクラス
 */
export class CocofoliaExporter {
  constructor() {
    this.memoTemplate = memoTemplateRaw;
    this.commandTemplate = commandTemplateRaw;
    this.MAX_MEMO_LENGTH = 200;
    this.BREAK_CHARS = ['\n', '。', '．'];
    this.MIN_BREAK_POSITION_RATIO = 0.5;
    this.defaults = {
      characterName: '名もなき冒険者',
      weapon1: '武器1',
      weapon2: '武器2',
      armor: '防具',
      groupLabel: '種別なし',
      statusDamage: 'ダメージ',
      statusScar: '傷痕',
      statusStress: 'ストレス',
    };
  }

  isEmptyValue(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
  }

  normalizeValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
    if (typeof value === 'boolean') return value ? 'true' : '';
    return String(value ?? '').trim();
  }

  mergeContext(parent, child) {
    const parentConditions = parent?.__conditions || {};

    if (child && typeof child === 'object' && !Array.isArray(child)) {
      const mergedConditions = { ...parentConditions, ...(child.__conditions || {}) };
      return { ...parent, ...child, __conditions: mergedConditions };
    }

    return { ...parent, value: child, __conditions: { ...parentConditions } };
  }

  getValue(key, context) {
    if (context && Object.prototype.hasOwnProperty.call(context, key)) {
      return this.normalizeValue(context[key]);
    }
    return '';
  }

  getConditionValue(key, context) {
    if (context?.__conditions && Object.prototype.hasOwnProperty.call(context.__conditions, key)) {
      return this.normalizeValue(context.__conditions[key]);
    }
    return this.getValue(key, context);
  }

  render(template, context) {
    const rendered = this.renderInternal(template, context || {});
    return this.compactWhitespace(rendered);
  }

  renderInternal(template, context) {
    if (!template) return '';

    const loopPattern = /\[#([^\]]+)]([\s\S]*?)\[\/\1]/g;
    let output = template.replace(loopPattern, (match, key, inner) => {
      const list = Array.isArray(context?.[key]) ? context[key] : [];
      if (!list.length) return '';

      return list
        .map((item) => {
          const mergedContext = this.mergeContext(context, item);
          return this.renderInternal(inner, mergedContext);
        })
        .join('');
    });

    output = this.processConditionalBlocks(output, context);

    const variablePattern = /\[([^\]\[#\/\?]+)]/g;
    output = output.replace(variablePattern, (match, key) => this.getValue(key, context));

    return output;
  }

  processConditionalBlocks(text, context) {
    let cursor = 0;
    let renderedText = '';

    while (cursor < text.length) {
      const start = text.indexOf('[?', cursor);
      if (start === -1) {
        renderedText += text.slice(cursor);
        break;
      }

      renderedText += text.slice(cursor, start);
      const end = this.findConditionalEnd(text, start + 2);

      if (end === -1) {
        renderedText += text.slice(start);
        break;
      }

      const inner = text.slice(start + 2, end);
      const variables = [...inner.matchAll(/\[([^\]\[#\/]+)]/g)].map(([, name]) => name);
      const hasValue = variables.some((name) => !this.isEmptyValue(this.getConditionValue(name, context)));

      if (hasValue) {
        renderedText += this.renderInternal(inner, context);
      }

      cursor = end + 1;
    }

    return renderedText;
  }

  findConditionalEnd(text, startIndex) {
    let depth = 0;
    for (let i = startIndex; i < text.length; i += 1) {
      if (text[i] === '[') {
        depth += 1;
      } else if (text[i] === ']') {
        if (depth === 0) {
          return i;
        }
        depth -= 1;
      }
    }
    return -1;
  }

  compactWhitespace(text) {
    const lines = text.split('\n').map((line) => line.trimEnd());
    const compacted = [];

    lines.forEach((line) => {
      const isEmpty = line.trim() === '';
      const previousEmpty = compacted.length > 0 && compacted[compacted.length - 1].trim() === '';

      if (isEmpty && previousEmpty) {
        return;
      }

      compacted.push(isEmpty ? '' : line);
    });

    return compacted.join('\n').trim();
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

  buildCharacterMemoInfo(memo) {
    if (!memo) {
      return '';
    }

    if (memo.length <= this.MAX_MEMO_LENGTH) {
      return memo.trim();
    }

    return this.truncateCharacterMemo(memo, this.MAX_MEMO_LENGTH).trim();
  }

  prepareViewData(data) {
    const {
      character,
      skills,
      specialSkills,
      equipments,
      speciesLabelMap,
      equipmentGroupLabelMap,
      specialSkillData,
      specialSkillsRequiringNote,
      weaponDamage,
    } = data;

    const displayName = character.name || this.defaults.characterName;
    const speciesText = speciesLabelMap[character.species] || character.species || '';
    const speciesDetail = character.rareSpecies || character.speciesDetail || '';

    const weaknessList = (character.weaknesses || [])
      .map((item) => ({ text: item?.text?.trim() || '' }))
      .filter((item) => !this.isEmptyValue(item.text));

    const skillList = (skills || []).map((skill) => {
      const dice = skill?.checked ? '2d10' : '1d10';
      const expertTexts = skill?.canHaveExperts
        ? (skill.experts || []).map((expert) => expert?.value?.trim() || '').filter((value) => !this.isEmptyValue(value))
        : [];
      const expert = expertTexts.join('/');
      const isDefense = skill?.name === '防御' ? '防御' : '';

      return {
        name: skill?.name || '',
        dice,
        expert,
        isDefense,
        __conditions: isDefense ? { isDefense, dice, name: skill?.name || '', expert } : { isDefense: '', dice: '', name: '', expert: '' },
      };
    });

    const specialSkillList = (specialSkills || []).map((ss) => {
      const groupOptions = specialSkillData?.[ss.group] || [];
      const skillOption = groupOptions.find((opt) => opt.value === ss.name);
      const label = skillOption ? skillOption.label : ss.name;
      const requireNote = specialSkillsRequiringNote?.includes(ss.name);
      const note = requireNote && ss.note ? ss.note : '';

      return { name: label || '', note: note || '' };
    });

    const equipmentsList = [];
    const appendEquipment = (item, fallbackName) => {
      if (!item) return;
      const hasValue = item.group || item.name;
      if (!hasValue) return;

      const groupLabel = equipmentGroupLabelMap?.[item.group] || item.group || this.defaults.groupLabel;
      const name = item.name || fallbackName;
      equipmentsList.push({ name, group: groupLabel });
    };

    appendEquipment(equipments?.weapon1, this.defaults.weapon1);
    appendEquipment(equipments?.weapon2, this.defaults.weapon2);
    appendEquipment(equipments?.armor, this.defaults.armor);

    const otherItems = character.otherItems || '';
    const memoText = this.buildCharacterMemoInfo(character.memo);

    const weaponList = [];
    const appendWeapon = (item, fallbackName) => {
      if (item?.group && weaponDamage?.[item.group]) {
        const name = item.name || fallbackName;
        weaponList.push({ formula: weaponDamage[item.group], name });
      }
    };

    appendWeapon(equipments?.weapon1, this.defaults.weapon1);
    appendWeapon(equipments?.weapon2, this.defaults.weapon2);

    return {
      name: displayName,
      playerName: character.playerName || '',
      species: speciesText,
      speciesDetail,
      gender: character.gender || '',
      age: character.age === 0 ? '0' : character.age || '',
      origin: character.origin || '',
      occupation: character.occupation || '',
      faith: character.faith || '',
      height: character.height || '',
      weight: character.weight || '',
      weaknesses: weaknessList,
      skills: skillList,
      specialSkills: specialSkillList,
      equipments: equipmentsList,
      otherItems,
      memo: memoText,
      weapons: weaponList,
    };
  }

  buildCocofoliaCharacterObject(character, memo, commands, currentWeight) {
    const scar = Number(character.currentScar) || 0;
    const stress = 0;

    return {
      kind: 'character',
      data: {
        params: [],
        status: [
          { label: this.defaults.statusDamage, value: 0 },
          { label: this.defaults.statusScar, value: scar },
          { label: this.defaults.statusStress, value: stress },
        ],
        name: character.name || this.defaults.characterName,
        initiative: currentWeight * -1,
        memo,
        externalUrl: '',
        commands,
      },
    };
  }

  generateCocofoliaData(data) {
    const viewData = this.prepareViewData(data);
    const memo = this.render(this.memoTemplate, viewData);
    const commands = this.render(this.commandTemplate, viewData);

    return this.buildCocofoliaCharacterObject(data.character, memo, commands, data.currentWeight);
  }
}

window.CocofoliaExporter = CocofoliaExporter;
