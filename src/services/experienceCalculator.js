(function (global) {
  function calcMax(character, histories, gameData) {
    const initialScarExp = Number(character.initialScar) || 0;
    const creationWeaknessExp = (character.weaknesses || []).reduce(
      (sum, w) =>
        sum +
        (w.text && w.text.trim() !== "" && w.acquired === "作成時"
          ? gameData.experiencePointValues.weakness
          : 0),
      0,
    );
    const combinedInitialBonus = Math.min(
      initialScarExp + creationWeaknessExp,
      gameData.experiencePointValues.maxInitialBonus,
    );
    const historyExp = (histories || []).reduce(
      (sum, h) => sum + (Number(h.gotExperiments) || 0),
      0,
    );
    return (
      gameData.experiencePointValues.basePoints +
      combinedInitialBonus +
      historyExp
    );
  }

  function calcCurrent(skills, specialSkills, gameData) {
    const skillExp = (skills || []).reduce(
      (sum, s) =>
        sum + (s.checked ? gameData.experiencePointValues.skillBase : 0),
      0,
    );
    const expertExp = (skills || []).reduce((sum, s) => {
      if (s.checked && s.canHaveExperts) {
        return (
          sum +
          s.experts.reduce(
            (expSum, exp) =>
              expSum +
              (exp.value && exp.value.trim() !== ""
                ? gameData.experiencePointValues.expertSkill
                : 0),
            0,
          )
        );
      }
      return sum;
    }, 0);
    const specialSkillExp = (specialSkills || []).reduce(
      (sum, ss) =>
        sum +
        (ss.name && ss.name.trim() !== ""
          ? gameData.experiencePointValues.specialSkill
          : 0),
      0,
    );
    return skillExp + expertExp + specialSkillExp;
  }

  function calcWeight(equipments, gameData) {
    const weaponWeights = gameData.equipmentWeights.weapon;
    const armorWeights = gameData.equipmentWeights.armor;
    let weight = 0;
    weight += weaponWeights[equipments.weapon1.group] || 0;
    weight += weaponWeights[equipments.weapon2.group] || 0;
    weight += armorWeights[equipments.armor.group] || 0;
    return weight;
  }

  global.ExperienceCalculator = {
    calcMax,
    calcCurrent,
    calcWeight,
  };
})(typeof window !== "undefined" ? window : globalThis);
