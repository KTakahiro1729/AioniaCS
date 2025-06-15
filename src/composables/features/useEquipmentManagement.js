import { computed } from "vue";
import { useCharacterStore } from "../../stores/characterStore.js";

export function useEquipmentManagement() {
  const characterStore = useCharacterStore();
  const currentWeight = computed(() => characterStore.currentWeight);
  return { currentWeight };
}
