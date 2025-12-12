import { CocofoliaExporter } from '@/features/character-sheet/services/cocofoliaExporter.js';

describe('CocofoliaExporter', () => {
  let exporter;
  beforeEach(() => {
    exporter = new CocofoliaExporter();
  });

  describe('render', () => {
    test('removes conditional blocks with only empty variables', () => {
      const template = `Header\n[? Section: [value]\n]\nFooter`;
      const result = exporter.render(template, { value: '' });
      expect(result).toBe('Header\n\nFooter');
      expect(result).not.toMatch(/\n{3,}/);
    });

    test('keeps nested conditional content when any variable has value and collapses blank lines', () => {
      const template = `Start\n[?Outer [outer]\n[?Inner [inner]\n[value]\n]\n]\nEnd`;
      const result = exporter.render(template, { outer: '', inner: 'x', value: 'kept' });
      expect(result).toContain('kept');
      expect(result).toContain('Outer');
      expect(result).not.toMatch(/\n{3,}/);
    });

    test('loops render with item context and conditional parts removed per iteration', () => {
      const template = `[#items]-[name][? ([note])]\n[/items]`;
      const result = exporter.render(template, {
        items: [
          { name: 'Alpha', note: '' },
          { name: 'Beta', note: 'ready' },
        ],
      });
      expect(result).toBe('-Alpha\n-Beta (ready)');
    });
  });

  test('buildCharacterBasicInfo returns expected lines', () => {
    const character = {
      name: 'ミーアナック',
      playerName: 'あろすてりっく',
      species: 'therianthropy',
      rareSpecies: '',
      gender: '男性',
      age: 30,
      origin: 'ラウステン王国',
      occupation: '商人',
      faith: '',
      height: '120cm',
      weight: '50kg',
    };
    const lines = exporter.buildCharacterBasicInfo(character, {
      therianthropy: '獣人',
    });
    expect(lines[0]).toBe('名前：ミーアナック（あろすてりっく）');
    expect(lines[1]).toBe('種族：獣人');
  });

  test('truncateCharacterMemo cuts string at punctuation', () => {
    const memo = 'これはとても長い文章です。途中で切れます';
    const truncated = exporter.truncateCharacterMemo(memo, 15);
    expect(truncated).toBe('これはとても長い文章です。…');
  });

  test('buildCocofoliaCommands assembles commands', () => {
    const skills = [
      { name: '運動', checked: true, canHaveExperts: false, experts: [] },
      { name: '防御', checked: true, canHaveExperts: false, experts: [] },
      {
        name: '白兵',
        checked: true,
        canHaveExperts: true,
        experts: [{ value: '剣' }],
      },
    ];
    const equipments = {
      weapon1: { group: 'sword', name: '剣' },
      weapon2: { group: '', name: '' },
    };
    const commands = exporter.buildCocofoliaCommands(skills, equipments, { sword: '2d6' });
    expect(commands.skillCommands).toContain('2d10 〈運動〉');
    expect(commands.skillCommands).toContain('2d10 〈防御〉');
    expect(commands.skillCommands).toContain('2d10+2 〈防御（防具あり）〉');
    expect(commands.skillCommands).toContain('3d10 〈白兵：剣〉');
    expect(commands.weaponCommands).toContain('2d6 〈ダメージ判定（剣）〉');
  });

  test('generateCocofoliaData returns object with memo and commands', () => {
    const data = {
      character: {
        name: 'ミーアナック',
        currentScar: 0,
        memo: '',
        weaknesses: [],
        otherItems: '',
      },
      skills: [],
      specialSkills: [],
      equipments: {
        weapon1: { group: '', name: '' },
        weapon2: { group: '', name: '' },
        armor: { group: '', name: '' },
      },
      currentWeight: 0,
      speciesLabelMap: { therianthropy: '獣人' },
      equipmentGroupLabelMap: {},
      specialSkillData: {},
      specialSkillsRequiringNote: [],
      weaponDamage: {},
    };
    const result = exporter.generateCocofoliaData(data);
    expect(result.kind).toBe('character');
    expect(result.data.memo).toContain('名前：ミーアナック');
    expect(result.data.commands).toContain('ダメージチェック');
  });
});
