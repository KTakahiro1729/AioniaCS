import commandTemplateRaw from '@/contents/cocofolia/command_template.txt?raw';
import memoTemplateRaw from '@/contents/cocofolia/memo_template.txt?raw';

const VARIABLE_PATTERN = /\[([a-zA-Z0-9_]+)\]/g;
const LOOP_PATTERN = /\[#([a-zA-Z0-9_]+)\]([\s\S]*?)\[\/\1\]/g;
const MAX_MEMO_LENGTH = 200;
const BREAK_CHARS = ['\n', '。', '．'];
const MIN_BREAK_POSITION_RATIO = 0.5;
const DEFAULTS = {
  characterName: '名もなき冒険者',
  weapon1: '武器1',
  weapon2: '武器2',
  armor: '防具',
  groupLabel: '種別なし',
  damageLabel: 'ダメージ',
  scarLabel: '傷痕',
  stressLabel: 'ストレス',
};

export class CocofoliaExporter {
  render(template, data = {}) {
    const renderTemplate = (content, context) => {
      if (!content) return '';

      const resolvedContext = context ?? {};

      const resolveValue = (key, scope = resolvedContext) => {
        const value = scope && Object.hasOwn(scope, key) ? scope[key] : resolvedContext[key];
        if (value === undefined || value === null) return '';
        return value;
      };

      const replaceVariables = (text) =>
        text.replace(VARIABLE_PATTERN, (_, key) => {
          const value = resolveValue(key);
          return value === undefined || value === null ? '' : String(value);
        });

      const extractVariables = (text) => {
        const variables = [];
        let match;
        while ((match = VARIABLE_PATTERN.exec(text)) !== null) {
          variables.push(match[1]);
        }
        VARIABLE_PATTERN.lastIndex = 0;
        return variables;
      };

      const renderLoops = (text) => {
        let result = '';
        let cursor = 0;
        let match;
        LOOP_PATTERN.lastIndex = 0;

        while ((match = LOOP_PATTERN.exec(text)) !== null) {
          const [whole, key, body] = match;
          result += text.slice(cursor, match.index);
          const list = resolveValue(key);
          let rendered = '';

          if (Array.isArray(list) && list.length > 0) {
            rendered = list
              .map((item) => {
                const iterationContext = item && typeof item === 'object' ? { ...resolvedContext, ...item } : { ...resolvedContext, item };
                return renderTemplate(body, iterationContext);
              })
              .join('');
          }

          const afterIndex = match.index + whole.length;
          const nextChar = text[afterIndex];
          if (rendered.endsWith('\n') && nextChar === '\n') {
            rendered = rendered.slice(0, -1);
          }

          result += rendered;
          cursor = afterIndex;
        }

        result += text.slice(cursor);
        return result;
      };

      const findConditionalEnd = (text, startIndex) => {
        let depth = 1;
        for (let i = startIndex; i < text.length; i += 1) {
          const char = text[i];
          if (char === '[') depth += 1;
          if (char === ']') {
            depth -= 1;
            if (depth === 0) return i;
          }
        }
        return -1;
      };

      const renderConditionals = (text) => {
        let cursor = 0;
        let renderedText = '';

        while (cursor < text.length) {
          const start = text.indexOf('[?', cursor);
          if (start === -1) {
            renderedText += text.slice(cursor);
            break;
          }

          renderedText += text.slice(cursor, start);
          const end = findConditionalEnd(text, start + 2);
          if (end === -1) {
            renderedText += text.slice(start);
            break;
          }

          const body = text.slice(start + 2, end);
          const bodyContent = body.replace(/^\s+/, '');
          const variables = extractVariables(bodyContent);
          const hasValue = variables.some((key) => {
            const value = resolveValue(key);
            return !(value === undefined || value === null || value === '');
          });

          if (hasValue) {
            renderedText += renderTemplate(bodyContent, resolvedContext);
          }

          cursor = end + 1;
          if (text[cursor] === '\n') {
            cursor += 1;
          }
        }

        return renderedText;
      };

      const afterLoops = renderLoops(content);
      const afterConditionals = renderConditionals(afterLoops);
      const finalText = replaceVariables(afterConditionals);

      return finalText;
    };

    return renderTemplate(template, data).replace(/\n+$/, '');
  }

  prepareData(data) {
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

    const displayName = character.name || DEFAULTS.characterName;
    const playerSuffix = character.playerName ? `（${character.playerName}）` : '';
    const speciesText = speciesLabelMap[character.species] || character.species;
    const speciesDisplay = character.species === 'other' ? `${speciesText}（${character.rareSpecies || '未設定'}）` : speciesText;

    const basicInfo = [{ line: `名前：${displayName}${playerSuffix}` }, { line: `種族：${speciesDisplay}` }];

    if (character.gender) basicInfo.push({ line: `性別：${character.gender}` });
    if (character.age !== null && character.age !== undefined) basicInfo.push({ line: `年齢：${character.age}` });
    if (character.origin) basicInfo.push({ line: `出身地：${character.origin}` });
    if (character.occupation) basicInfo.push({ line: `職業：${character.occupation}` });
    if (character.faith) basicInfo.push({ line: `信仰：${character.faith}` });
    if (character.height) basicInfo.push({ line: `身長：${character.height}` });
    if (character.weight) basicInfo.push({ line: `体重：${character.weight}` });

    const weaknesses = (character.weaknesses || [])
      .map((w) => (w.text && w.text.trim() !== '' ? w.text : ''))
      .filter(Boolean)
      .join('\n');

    const skillsEntries = (skills || []).reduce((acc, skill) => {
      if (!skill.name) return acc;
      const expertTexts =
        skill.checked && skill.canHaveExperts
          ? skill.experts.filter((e) => e.value && e.value.trim() !== '').map((e) => e.value.trim())
          : [];

      if (skill.checked && expertTexts.length > 0) {
        expertTexts.forEach((expert) => acc.push({ entry: `〈${skill.name}：${expert}〉` }));
      } else {
        acc.push({ entry: `〈${skill.name}〉` });
      }

      return acc;
    }, []);

    const specialSkillEntries = (specialSkills || []).reduce((acc, ss) => {
      if (!ss.group || !ss.name) return acc;
      const groupOptions = specialSkillData[ss.group] || [];
      const skillOption = groupOptions.find((opt) => opt.value === ss.name);
      const skillLabel = skillOption ? skillOption.label : ss.name;

      if (specialSkillsRequiringNote.includes(ss.name) && ss.note) {
        acc.push({ entry: `《${skillLabel}：${ss.note}》` });
      } else {
        acc.push({ entry: `《${skillLabel}》` });
      }
      return acc;
    }, []);

    const equipmentEntries = [];
    if (equipments.weapon1?.group || equipments.weapon1?.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.weapon1.group] || equipments.weapon1.group || DEFAULTS.groupLabel;
      const name = equipments.weapon1.name || DEFAULTS.weapon1;
      equipmentEntries.push({ item: `${name}（${groupLabel}）` });
    }
    if (equipments.weapon2?.group || equipments.weapon2?.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.weapon2.group] || equipments.weapon2.group || DEFAULTS.groupLabel;
      const name = equipments.weapon2.name || DEFAULTS.weapon2;
      equipmentEntries.push({ item: `${name}（${groupLabel}）` });
    }
    if (equipments.armor?.group || equipments.armor?.name) {
      const groupLabel = equipmentGroupLabelMap[equipments.armor.group] || equipments.armor.group || DEFAULTS.groupLabel;
      const name = equipments.armor.name || DEFAULTS.armor;
      equipmentEntries.push({ item: `${name}（${groupLabel}）` });
    }

    const otherItems = character.otherItems || '';
    const memo = this.truncateCharacterMemo(character.memo || '');

    const baseCommands = this.buildBaseCommands(character);
    const skillCommands = this.buildSkillCommands(skills);
    const weaponCommands = this.buildWeaponCommands(equipments, weaponDamage);

    return {
      basicInfo,
      weaknesses,
      skills: skillsEntries,
      specialSkills: specialSkillEntries,
      equipment: equipmentEntries,
      otherItems,
      memo,
      baseCommands,
      skillCommands,
      weaponCommands,
      initiative: currentWeight * -1,
      name: displayName,
      statuses: this.buildStatuses(character),
    };
  }

  truncateCharacterMemo(memo, maxLength = MAX_MEMO_LENGTH) {
    if (!memo) return '';
    if (memo.length <= maxLength) return memo.trim();

    const sub = memo.substring(0, maxLength);
    let lastBreak = -1;

    for (const char of BREAK_CHARS) {
      const idx = sub.lastIndexOf(char);
      if (idx > lastBreak && idx > maxLength * MIN_BREAK_POSITION_RATIO) {
        lastBreak = idx;
      }
    }

    if (lastBreak !== -1) {
      return memo.substring(0, lastBreak + 1) + (memo.length > lastBreak + 1 ? '…' : '');
    }

    return memo.substring(0, maxLength) + '…';
  }

  buildBaseCommands(character) {
    const damage = Number(character.damage) || 0;
    const scar = Number(character.currentScar) || 0;
    const stress = Number(character.stress) || 0;

    return [
      { command: `1d100>=${damage}+${scar} 〈ダメージチェック〉` },
      { command: `1d100>=${stress} 〈ストレスチェック〉` },
      { command: `:傷痕=${scar}+${damage}/2 〈治癒①〉` },
      { command: `:ダメージ=${damage}                 〈治癒②〉` },
    ];
  }

  buildSkillCommands(skills = []) {
    const commands = [];
    skills.forEach((skill) => {
      if (!skill.name) return;
      const dice = skill.checked ? '2d10' : '1d10';
      commands.push({ command: `${dice} 〈${skill.name}〉` });

      if (skill.name === '防御') {
        commands.push({ command: `${dice} 〈${skill.name}（防具なし）〉` });
        commands.push({ command: `${dice}+2 〈${skill.name}（防具あり）〉` });
      }

      if (skill.checked && skill.canHaveExperts) {
        skill.experts
          .filter((expert) => expert.value && expert.value.trim() !== '')
          .forEach((expert) => commands.push({ command: `3d10 〈${skill.name}：${expert.value}〉` }));
      }
    });
    return commands;
  }

  buildWeaponCommands(equipments, weaponDamage) {
    const commands = [];

    const addWeapon = (weapon, fallbackName) => {
      if (weapon?.group && weaponDamage[weapon.group]) {
        const weaponName = weapon.name || fallbackName;
        commands.push({ command: `${weaponDamage[weapon.group]} 〈ダメージ判定（${weaponName}）〉` });
      }
    };

    addWeapon(equipments.weapon1, DEFAULTS.weapon1);
    addWeapon(equipments.weapon2, DEFAULTS.weapon2);

    return commands;
  }

  buildStatuses(character) {
    const scar = Number(character.currentScar) || 0;
    const stress = Number(character.stress) || 0;

    return [
      { label: DEFAULTS.damageLabel, value: 0 },
      { label: DEFAULTS.scarLabel, value: scar },
      { label: DEFAULTS.stressLabel, value: stress },
    ];
  }

  generateCocofoliaData(data) {
    const viewModel = this.prepareData(data);
    const memo = this.render(memoTemplateRaw, viewModel).trim();
    const commands = this.render(commandTemplateRaw, viewModel).trim();

    return {
      kind: 'character',
      data: {
        params: [],
        status: viewModel.statuses,
        name: viewModel.name,
        initiative: viewModel.initiative,
        memo,
        externalUrl: '',
        commands,
      },
    };
  }
}

if (typeof window !== 'undefined') {
  window.CocofoliaExporter = CocofoliaExporter;
}
