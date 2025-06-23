import { setActivePinia, createPinia } from 'pinia';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { AioniaGameData } from '../../../src/data/gameData.js';

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
});
