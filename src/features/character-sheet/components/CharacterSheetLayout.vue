<script setup>
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import CopyrightFooter from '@/features/character-sheet/components/ui/CopyrightFooter.vue';

import CharacterBasicInfo from '@/features/character-sheet/components/sections/CharacterBasicInfo.vue';
import ScarWeaknessSection from '@/features/character-sheet/components/sections/ScarWeaknessSection.vue';
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
    <ScarWeaknessSection />
    <SkillsSection />
    <SpecialSkillsSection />
    <ItemsSection />
    <CharacterMemoSection />
    <AdventureLogSection />
  </div>
  <CopyrightFooter />
</template>
