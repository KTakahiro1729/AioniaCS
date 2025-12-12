import { CocofoliaExporter } from '@/features/character-sheet/services/cocofoliaExporter.js';

const createExporter = () => new CocofoliaExporter();

describe('CocofoliaExporter render system', () => {
  test('render substitutes variables and strips missing values', () => {
    const exporter = createExporter();
    const template = 'Name: [name]\n[? Title: [title]\n]\nNote: [note]';
    const result = exporter.render(template, { name: 'Alice', title: '', note: null });
    expect(result).toBe('Name: Alice\nNote: ');

    const withTitle = exporter.render(template, { name: 'Alice', title: 'Captain', note: 'Hello' });
    expect(withTitle).toBe('Name: Alice\nTitle: Captain\nNote: Hello');
  });

  test('render repeats loop blocks for arrays', () => {
    const exporter = createExporter();
    const template = 'Items:\n[#items]- [label]\n[/items]\nEnd';
    const result = exporter.render(template, {
      items: [{ label: 'One' }, { label: 'Two' }],
    });

    expect(result).toBe('Items:\n- One\n- Two\nEnd');
  });
});

describe('CocofoliaExporter data preparation', () => {
  test('prepareData flattens character information', () => {
    const exporter = createExporter();
    const data = {
      character: {
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
        weaknesses: [{ text: '火に弱い' }],
        memo: 'これはメモです',
        otherItems: 'ロープ',
        currentScar: 1,
      },
      skills: [
        { name: '運動', checked: true, canHaveExperts: false, experts: [] },
        { name: '防御', checked: true, canHaveExperts: false, experts: [] },
        {
          name: '白兵',
          checked: true,
          canHaveExperts: true,
          experts: [{ value: '剣' }],
        },
      ],
      specialSkills: [{ group: 'general', name: '強運' }],
      equipments: {
        weapon1: { group: 'sword', name: '剣' },
        weapon2: { group: '', name: '' },
        armor: { group: 'light', name: '革鎧' },
      },
      currentWeight: 0,
      speciesLabelMap: { therianthropy: '獣人' },
      equipmentGroupLabelMap: { sword: '剣', light: '軽鎧' },
      specialSkillData: { general: [{ value: '強運', label: '強運' }] },
      specialSkillsRequiringNote: [],
      weaponDamage: { sword: '2d6' },
    };

    const viewModel = exporter.prepareData(data);
    expect(viewModel.basicInfo[0].line).toBe('名前：ミーアナック（あろすてりっく）');
    expect(viewModel.basicInfo[1].line).toBe('種族：獣人');
    expect(viewModel.skills).toEqual([{ entry: '〈運動〉' }, { entry: '〈防御〉' }, { entry: '〈白兵：剣〉' }]);
    expect(viewModel.weaponCommands[0].command).toContain('ダメージ判定（剣）');
  });

  test('generateCocofoliaData builds memo and commands from templates', () => {
    const exporter = createExporter();
    const data = {
      character: {
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
        weaknesses: [{ text: '火に弱い' }],
        memo: 'これはメモです',
        otherItems: 'ロープ',
        currentScar: 0,
      },
      skills: [{ name: '運動', checked: true, canHaveExperts: false, experts: [] }],
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
    expect(result.data.memo).toContain('【基本情報】');
    expect(result.data.memo).toContain('名前：ミーアナック（あろすてりっく）');
    expect(result.data.memo).toContain('【技能】');
    expect(result.data.commands).toContain('1d100>=0+0 〈ダメージチェック〉');
    expect(result.data.commands).toContain('2d10 〈運動〉');
  });
});
