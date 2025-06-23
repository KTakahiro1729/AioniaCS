import { computed } from 'vue';
import { useCharacterStore } from '../../stores/characterStore.js';

export function useWeaknessManagement() {
  const characterStore = useCharacterStore();
  const sessionNamesForWeaknessDropdown = computed(() => characterStore.sessionNamesForWeaknessDropdown);
  return { sessionNamesForWeaknessDropdown };
}
