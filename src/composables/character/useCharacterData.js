import { reactive } from "vue";
import { AioniaGameData } from "../../data/gameData.js";
import { deepClone, createWeaknessArray } from "../../utils/utils.js";

export function useCharacterData() {
  const character = reactive(() => {
    const base = deepClone(AioniaGameData.defaultCharacterData);
    base.weaknesses = createWeaknessArray(AioniaGameData.config.maxWeaknesses);
    return base;
  })();

  const skills = reactive(deepClone(AioniaGameData.baseSkills));
  const specialSkills = reactive(
    Array(AioniaGameData.config.initialSpecialSkillCount)
      .fill(null)
      .map(() => ({ group: "", name: "", note: "", showNote: false })),
  );
  const equipments = reactive({
    weapon1: { group: "", name: "" },
    weapon2: { group: "", name: "" },
    armor: { group: "", name: "" },
  });
  const histories = reactive([
    { sessionName: "", gotExperiments: null, memo: "" },
  ]);

  return { character, skills, specialSkills, equipments, histories };
}
