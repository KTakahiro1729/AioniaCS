import { reactive } from "vue";
import { AioniaGameData } from "../../data/gameData.js";
import { deepClone, createWeaknessArray } from "../../utils/utils.js";

export function useCharacterData() {
  function createCharacter() {
    const base = deepClone(AioniaGameData.defaultCharacterData);
    base.weaknesses = createWeaknessArray(
      AioniaGameData.config.maxWeaknesses,
    );
    return base;
  }

  const character = reactive(createCharacter());
  const skills = reactive(deepClone(AioniaGameData.baseSkills));
  const specialSkills = reactive(
    Array(AioniaGameData.config.initialSpecialSkillCount)
      .fill(null)
      .map(() => ({ group: "", name: "", note: "", showNote: false }))
  );
  const equipments = reactive({
    weapon1: { group: "", name: "" },
    weapon2: { group: "", name: "" },
    armor: { group: "", name: "" },
  });
  const histories = reactive([
    { sessionName: "", gotExperiments: null, memo: "" },
  ]);

  function resetCharacter() {
    Object.assign(character, createCharacter());
  }

  function resetSkills() {
    skills.splice(0, skills.length, ...deepClone(AioniaGameData.baseSkills));
  }

  function resetSpecialSkills() {
    specialSkills.splice(
      0,
      specialSkills.length,
      ...Array(AioniaGameData.config.initialSpecialSkillCount)
        .fill(null)
        .map(() => ({ group: "", name: "", note: "", showNote: false })),
    );
  }

  function resetEquipments() {
    equipments.weapon1.group = "";
    equipments.weapon1.name = "";
    equipments.weapon2.group = "";
    equipments.weapon2.name = "";
    equipments.armor.group = "";
    equipments.armor.name = "";
  }

  function resetHistories() {
    histories.splice(0, histories.length, {
      sessionName: "",
      gotExperiments: null,
      memo: "",
    });
  }

  function initializeAll() {
    resetCharacter();
    resetSkills();
    resetSpecialSkills();
    resetEquipments();
    resetHistories();
  }

  return {
    character,
    skills,
    specialSkills,
    equipments,
    histories,
    resetCharacter,
    resetSkills,
    resetSpecialSkills,
    resetEquipments,
    resetHistories,
    initializeAll,
  };
}

