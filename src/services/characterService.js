(function (global) {
  function createBaseCharacter(gameData) {
    const base = global.deepClone(gameData.defaultCharacterData);
    base.weaknesses = global.createWeaknessArray(gameData.config.maxWeaknesses);
    return base;
  }

  global.CharacterService = {
    createBaseCharacter,
  };
})(typeof window !== "undefined" ? window : globalThis);
