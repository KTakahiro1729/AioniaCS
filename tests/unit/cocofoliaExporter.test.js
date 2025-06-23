import { CocofoliaExporter } from '../../src/services/cocofoliaExporter.js';

describe('CocofoliaExporter', () => {
  let exporter;
  beforeEach(() => {
    exporter = new CocofoliaExporter();
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
    const character = { currentScar: 1 };
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
    const commands = exporter.buildCocofoliaCommands(character, skills, equipments, { sword: '2d6' });
    expect(commands).toContain('2d10 〈運動〉');
    expect(commands).toContain('2d10 〈防御〉');
    expect(commands).toContain('2d10+2 〈防御（防具）〉');
    expect(commands).toContain('3d10 〈白兵：剣〉');
    expect(commands).toContain('2d6 〈ダメージ判定（剣）〉');
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
