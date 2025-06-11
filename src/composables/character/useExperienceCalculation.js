import { computed } from "vue";
import { AioniaGameData } from "../../data/gameData.js";

export function useExperienceCalculation(
  character,
  skills,
  specialSkills,
  histories,
  equipments,
) {
  const maxExperiencePoints = computed(() => {
    const initialScarExp = Number(character.initialScar) || 0;
    const creationWeaknessExp = character.weaknesses.reduce(
      (sum, w) =>
        sum +
        (w.text && w.text.trim() !== "" && w.acquired === "作成時"
          ? AioniaGameData.experiencePointValues.weakness
          : 0),
      0,
    );
    const combinedInitialBonus = Math.min(
      initialScarExp + creationWeaknessExp,
      AioniaGameData.experiencePointValues.maxInitialBonus,
    );
    const historyExp = histories.reduce(
      (sum, h) => sum + (Number(h.gotExperiments) || 0),
      0,
    );
    return (
      AioniaGameData.experiencePointValues.basePoints +
      combinedInitialBonus +
      historyExp
    );
  });

  const currentExperiencePoints = computed(() => {
    const skillExp = skills.reduce(
      (sum, s) =>
        sum + (s.checked ? AioniaGameData.experiencePointValues.skillBase : 0),
      0,
    );
    const expertExp = skills.reduce((sum, s) => {
      if (s.checked && s.canHaveExperts) {
        return (
          sum +
          s.experts.reduce(
            (expSum, exp) =>
              expSum +
              (exp.value && exp.value.trim() !== ""
                ? AioniaGameData.experiencePointValues.expertSkill
                : 0),
            0,
          )
        );
      }
      return sum;
    }, 0);
    const specialSkillExp = specialSkills.reduce(
      (sum, ss) =>
        sum +
        (ss.name && ss.name.trim() !== ""
          ? AioniaGameData.experiencePointValues.specialSkill
          : 0),
      0,
    );
    return skillExp + expertExp + specialSkillExp;
  });

  const currentWeight = computed(() => {
    const weaponWeights = AioniaGameData.equipmentWeights.weapon;
    const armorWeights = AioniaGameData.equipmentWeights.armor;
    let weight = 0;
    weight += weaponWeights[equipments.weapon1.group] || 0;
    weight += weaponWeights[equipments.weapon2.group] || 0;
    weight += armorWeights[equipments.armor.group] || 0;
    return weight;
  });

  const experienceStatusClass = computed(() =>
    currentExperiencePoints.value > maxExperiencePoints.value
      ? "status-display--experience-over"
      : "status-display--experience-ok",
  );

  return {
    maxExperiencePoints,
    currentExperiencePoints,
    currentWeight,
    experienceStatusClass,
  };
}
