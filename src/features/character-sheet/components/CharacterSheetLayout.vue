<script setup>
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import CopyrightFooter from '@/features/character-sheet/components/ui/CopyrightFooter.vue';

import CharacterBasicInfo from '@/features/character-sheet/components/sections/CharacterBasicInfo.vue';
import ScarSection from '@/features/character-sheet/components/sections/ScarSection.vue';
import WeaknessSection from '@/features/character-sheet/components/sections/WeaknessSection.vue';
import SkillsSection from '@/features/character-sheet/components/sections/SkillsSection.vue';
import SpecialSkillsSection from '@/features/character-sheet/components/sections/SpecialSkillsSection.vue';
import ItemsSection from '@/features/character-sheet/components/sections/ItemsSection.vue';
import CharacterMemoSection from '@/features/character-sheet/components/sections/CharacterMemoSection.vue';
import AdventureLogSection from '@/features/character-sheet/components/sections/AdventureLogSection.vue';

const characterStore = useCharacterStore();
</script>

<template>
  <div class="main-grid">
    <CharacterBasicInfo />
    <div class="scar-weakness-wrapper">
      <ScarSection />
      <WeaknessSection />
    </div>
    <SkillsSection />
    <SpecialSkillsSection />
    <ItemsSection />
    <CharacterMemoSection />
    <AdventureLogSection />
  </div>
  <CopyrightFooter />
</template>

<style scoped>
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px 10px;
  grid-template-areas:
    'character-info scar-weakness'
    'skills special-skills'
    'items items'
    'memo memo'
    'history history';
}

.character-info {
  grid-area: character-info;
}

.scar-weakness-wrapper {
  grid-area: scar-weakness;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skills {
  grid-area: skills;
}

.special-skills {
  grid-area: special-skills;
}

.items {
  grid-area: items;
}

.character-memo {
  grid-area: memo;
}

.adventure-log-section {
  grid-area: history;
}

@media (max-width: 768px) {
  .main-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'character-info'
      'scar-weakness'
      'skills'
      'special-skills'
      'items'
      'memo'
      'history';
    gap: 20px;
  }

  .scar-weakness-wrapper {
    gap: 20px;
  }
}
</style>
