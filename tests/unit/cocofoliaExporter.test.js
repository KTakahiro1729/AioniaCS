import { CocofoliaExporter } from '@/features/character-sheet/services/cocofoliaExporter.js';

describe('CocofoliaExporter', () => {
  let exporter;

  beforeEach(() => {
    exporter = new CocofoliaExporter();
  });

  describe('render', () => {
    test('removes conditional block when all variables are empty', () => {
      const template = '[?名前：[name]\n]\n次の行';
      const result = exporter.render(template, { name: '' });
      expect(result).toBe('次の行');
    });

    test('keeps nested conditional blocks only when condition values exist', () => {
      const template =
        '[#skills]\n[dice] 〈[name]〉\n[?[isDefense]\n[dice] 〈[name]（防具なし）〉\n[dice]+2 〈[name]（防具あり）〉]\n[/skills]';

      const result = exporter.render(template, {
        skills: [
          {
            name: '運動',
            dice: '1d10',
            isDefense: '',
            __conditions: { isDefense: '', dice: '', name: '' },
          },
          {
            name: '防御',
            dice: '2d10',
            isDefense: '防御',
            __conditions: { isDefense: '防御', dice: '2d10', name: '防御' },
          },
        ],
      });

      expect(result).toContain('1d10 〈運動〉');
      expect(result).toContain('2d10 〈防御〉');
      expect(result).toContain('2d10+2 〈防御（防具あり）〉');
      expect(result).not.toContain('1d10 〈運動（防具なし）〉');
    });
  });

  describe('helpers', () => {
    test('truncateCharacterMemo cuts string at punctuation', () => {
      const memo = 'これはとても長い文章です。途中で切れます';
      const truncated = exporter.truncateCharacterMemo(memo, 15);
      expect(truncated).toBe('これはとても長い文章です。…');
    });
  });

  describe('generateCocofoliaData', () => {
    test('creates memo and commands from templates', () => {
      const data = {
        character: {
          name: 'ミーアナック',
          playerName: 'あろすてりっく',
          species: 'therianthropy',
          rareSpecies: '銀狼',
          gender: '男性',
          age: 30,
          origin: 'ラウステン王国',
          occupation: '商人',
          memo: '追加メモ',
          weaknesses: [{ text: '高所恐怖症' }],
          otherItems: 'ロープ',
          currentScar: 1,
        },
        skills: [
          { name: '運動', checked: true, canHaveExperts: false, experts: [] },
          { name: '防御', checked: true, canHaveExperts: false, experts: [] },
          { name: '白兵', checked: true, canHaveExperts: true, experts: [{ value: '剣' }] },
        ],
        specialSkills: [{ group: 'battle', name: 'rapid', note: '二回行動' }],
        equipments: {
          weapon1: { group: 'sword', name: '剣' },
          weapon2: { group: '', name: '' },
          armor: { group: 'light', name: '革鎧' },
        },
        currentWeight: 2,
        speciesLabelMap: { therianthropy: '獣人' },
        equipmentGroupLabelMap: { sword: '片手剣', light: '軽鎧' },
        specialSkillData: { battle: [{ value: 'rapid', label: '疾風' }] },
        specialSkillsRequiringNote: ['rapid'],
        weaponDamage: { sword: '2d6' },
      };

      const result = exporter.generateCocofoliaData(data);

      expect(result.kind).toBe('character');
      expect(result.data.memo).toContain('ミーアナック（あろすてりっく）');
      expect(result.data.memo).toContain('種族：獣人（銀狼）');
      expect(result.data.memo).toContain('【武器・防具】');
      expect(result.data.memo).toContain('剣（片手剣）');

      expect(result.data.commands).toContain('1d100>={ダメージ}+{傷痕} 〈ダメージチェック〉');
      expect(result.data.commands).toContain('2d10+2 〈防御（防具あり）〉');
      expect(result.data.commands).toContain('2d6 〈ダメージ判定（剣）〉');
    });
  });
});
