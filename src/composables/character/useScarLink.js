import { watch } from 'vue';

export function useScarLink(character) {
  watch(
    () => character.initialScar,
    (newVal) => {
      if (character.linkCurrentToInitialScar) {
        character.currentScar = newVal;
      }
    },
  );

  watch(
    () => character.linkCurrentToInitialScar,
    (isLinked) => {
      if (isLinked) {
        character.currentScar = character.initialScar;
      }
    },
  );
}
