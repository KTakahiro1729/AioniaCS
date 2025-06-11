import { computed } from "vue";
import { AioniaGameData } from "../../data/gameData.js";

export function useEquipmentManagement(equipmentsRef) {
  const currentWeight = computed(() => {
    const weaponWeights = AioniaGameData.equipmentWeights.weapon;
    const armorWeights = AioniaGameData.equipmentWeights.armor;
    let weight = 0;
    weight += weaponWeights[equipmentsRef.value.weapon1.group] || 0;
    weight += weaponWeights[equipmentsRef.value.weapon2.group] || 0;
    weight += armorWeights[equipmentsRef.value.armor.group] || 0;
    return weight;
  });

  return { currentWeight };
}
