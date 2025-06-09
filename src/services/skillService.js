(function (global) {
  function availableSpecialSkillNames(specialSkills, index, gameData) {
    if (specialSkills[index]) {
      const group = specialSkills[index].group;
      return gameData.specialSkillData[group] || [];
    }
    return [];
  }

  function updateSpecialSkillNoteVisibility(specialSkill, gameData) {
    const skillName = specialSkill.name;
    specialSkill.showNote = (
      gameData.specialSkillsRequiringNote || []
    ).includes(skillName);
  }

  global.SkillService = {
    availableSpecialSkillNames,
    updateSpecialSkillNoteVisibility,
  };
})(typeof window !== "undefined" ? window : globalThis);
