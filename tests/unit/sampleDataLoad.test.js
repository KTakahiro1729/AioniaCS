import fs from 'fs';
import path from 'path';
import { setActivePinia, createPinia } from 'pinia';
import { DataManager } from '../../src/services/dataManager.js';
import { AioniaGameData } from '../../src/data/gameData.js';
import { useCharacterStore } from '../../src/stores/characterStore.js';

const sampleDir = path.resolve(__dirname, '../../sample-data');
const sampleFiles = fs.readdirSync(sampleDir).filter((f) => f.endsWith('.json'));

describe('DataManager loads sample data', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test.each(sampleFiles)('load %s without mutation', (filename) => {
    const dm = new DataManager(AioniaGameData);
    const store = useCharacterStore();
    const raw = JSON.parse(fs.readFileSync(path.join(sampleDir, filename), 'utf8'));
    const parsed = dm.parseLoadedData(raw);
    Object.assign(store.character, parsed.character);
    store.skills.splice(0, store.skills.length, ...parsed.skills);
    store.specialSkills.splice(0, store.specialSkills.length, ...parsed.specialSkills);
    Object.assign(store.equipments, parsed.equipments);
    store.histories.splice(0, store.histories.length, ...parsed.histories);
    expect(store.character.name).toBe(raw.character.name);
    expect(store.character.age).toBe(raw.character.age ?? null);
  });
});
