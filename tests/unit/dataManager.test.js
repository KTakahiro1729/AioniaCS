// Set up global window object and load utilities
global.window = {};
require('../utils.js');
require('../gameData.js');
global.deepClone = window.deepClone;
global.createWeaknessArray = window.createWeaknessArray;
require('../dataManager.js');

const DataManager = window.DataManager;
const gameData = window.AioniaGameData;

describe('DataManager', () => {
  let dm;
  beforeEach(() => {
    dm = new DataManager(gameData);
  });

  test('convertExternalJsonToInternalFormat converts minimal data', () => {
    const external = {
      name: 'foo',
      player: 'bar',
      init_weakness1: 'fear',
      weapon1_type: 'sword',
      weapon1_name: 'blade',
      history: [{ name: 'sess1', experiments: '2', stress: 'note' }]
    };
    const internal = dm.convertExternalJsonToInternalFormat(external);
    expect(internal.character.name).toBe('foo');
    expect(internal.character.playerName).toBe('bar');
    expect(internal.character.weaknesses[0]).toEqual({ text: 'fear', acquired: '作成時' });
    expect(internal.equipments.weapon1).toEqual({ group: 'sword', name: 'blade' });
    expect(internal.histories[0]).toEqual({ sessionName: 'sess1', gotExperiments: 2, memo: 'note' });
  });

  test('_normalizeLoadedData fills defaults', () => {
    const result = dm._normalizeLoadedData({});
    expect(result.character.weaknesses).toHaveLength(gameData.config.maxWeaknesses);
    result.character.weaknesses.forEach(w => {
      expect(w).toEqual({ text: '', acquired: '--' });
    });
    expect(result.skills).toHaveLength(gameData.baseSkills.length);
    expect(result.histories).toEqual([{ sessionName: '', gotExperiments: null, memo: '' }]);
    expect(result.character.linkCurrentToInitialScar).toBe(true);
  });

  test('_normalizeHistoryData returns default when empty', () => {
    expect(dm._normalizeHistoryData([])).toEqual([{ sessionName: '', gotExperiments: null, memo: '' }]);
  });
});
