import { setActivePinia, createPinia } from 'pinia';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { AioniaGameData } from '@/data/gameData.js';

describe('characterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('addSpecialSkillItem respects max limit', () => {
    const store = useCharacterStore();
    store.specialSkills.splice(0, store.specialSkills.length); // reset
    const max = AioniaGameData.config.maxSpecialSkills;
    for (let i = 0; i < max + 2; i++) {
      store.addSpecialSkillItem();
    }
    expect(store.specialSkills.length).toBeLessThanOrEqual(max);
  });

  test('currentWeight calculates equipment weight', () => {
    const store = useCharacterStore();
    store.equipments.weapon1.group = 'combat_small';
    store.equipments.weapon2.group = 'shooting';
    store.equipments.armor.group = 'light_armor';
    const expected =
      AioniaGameData.equipmentWeights.weapon['combat_small'] +
      AioniaGameData.equipmentWeights.weapon['shooting'] +
      AioniaGameData.equipmentWeights.armor['light_armor'];
    expect(store.currentWeight).toBe(expected);
  });

  test('addExpert adds an expert', () => {
    const store = useCharacterStore();
    const skill = store.skills.find((s) => s.id === 'motion');
    const initial = skill.experts.length;
    store.addExpert('motion');
    expect(skill.experts.length).toBe(initial + 1);
  });

  test('removeExpert cleans up correctly', () => {
    const store = useCharacterStore();
    const skill = store.skills.find((s) => s.id === 'motion');
    skill.experts = [{ value: 'foo' }, { value: 'bar' }];
    store.removeExpert('motion', 1);
    expect(skill.experts.length).toBe(1);
    expect(skill.experts[0].value).toBe('foo');
    store.removeExpert('motion', 0);
    expect(skill.experts.length).toBe(1);
    expect(skill.experts[0].value).toBe('');
  });

  test('calculatedScar reflects initial value when no increments are present', () => {
    const store = useCharacterStore();
    store.character.initialScar = 7;
    expect(store.calculatedScar).toBe(7);
  });

  test('calculatedScar includes positive scar increases from adventure log', () => {
    const store = useCharacterStore();
    store.character.initialScar = 3;
    store.adventureLog[0].increasedScar = 4;
    expect(store.calculatedScar).toBe(7);
  });

  test('calculatedScar sums multiple scar increases including zeros', () => {
    const store = useCharacterStore();
    store.character.initialScar = 2;
    store.adventureLog[0].increasedScar = 0;
    store.addHistoryItem();
    store.adventureLog[1].increasedScar = 5;
    store.addHistoryItem();
    store.adventureLog[2].increasedScar = 3;
    expect(store.calculatedScar).toBe(10);
  });

  describe('calculatedScar', () => {
    test('sums increased scars with initial value', () => {
      const store = useCharacterStore();
      store.character.initialScar = 5;
      store.adventureLog.splice(
        0,
        store.adventureLog.length,
        ...[
          { sessionName: 'Session 1', gotExperiments: 10, memo: '', increasedScar: 2 },
          { sessionName: 'Session 2', gotExperiments: 5, memo: '', increasedScar: 3 },
        ],
      );

      expect(store.calculatedScar).toBe(10);
    });

    test('handles zero values without NaN', () => {
      const store = useCharacterStore();
      store.character.initialScar = 0;
      store.adventureLog[0].increasedScar = 0;

      expect(store.calculatedScar).toBe(0);
    });

    test('ignores non-numeric values when summing', () => {
      const store = useCharacterStore();
      store.character.initialScar = 7;
      store.adventureLog.splice(
        0,
        store.adventureLog.length,
        ...[
          { sessionName: 'Session 1', gotExperiments: 4, memo: '', increasedScar: 1 },
          { sessionName: 'Session 2', gotExperiments: 4, memo: '', increasedScar: null },
          { sessionName: 'Session 3', gotExperiments: 4, memo: '', increasedScar: '3' },
        ],
      );

      expect(store.calculatedScar).toBe(11);
    });
  });
});
