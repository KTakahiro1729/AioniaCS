<script setup>
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useModal } from '@/features/modals/composables/useModal.js';
import PrivacyPolicyModal from '@/features/modals/components/contents/PrivacyPolicyModal.vue';

import CharacterBasicInfo from '@/features/character-sheet/components/sections/CharacterBasicInfo.vue';
import ScarSection from '@/features/character-sheet/components/sections/ScarSection.vue';
import WeaknessSection from '@/features/character-sheet/components/sections/WeaknessSection.vue';
import SkillsSection from '@/features/character-sheet/components/sections/SkillsSection.vue';
import SpecialSkillsSection from '@/features/character-sheet/components/sections/SpecialSkillsSection.vue';
import ItemsSection from '@/features/character-sheet/components/sections/ItemsSection.vue';
import CharacterMemoSection from '@/features/character-sheet/components/sections/CharacterMemoSection.vue';
import AdventureLogSection from '@/features/character-sheet/components/sections/AdventureLogSection.vue';

const characterStore = useCharacterStore();
const { showModal } = useModal();

const buildBranch = import.meta.env.VITE_BUILD_BRANCH;
const buildHash = import.meta.env.VITE_BUILD_HASH;
const buildDate = import.meta.env.VITE_BUILD_DATE;
const buildInfo = buildBranch && buildHash && buildDate ? `${buildBranch} (${buildHash}) ${buildDate}` : '';

async function openPrivacyPolicy() {
  await showModal({
    component: PrivacyPolicyModal,
    title: 'プライバシーポリシー',
    buttons: [{ label: '閉じる', value: 'close', variant: 'secondary' }],
  });
}
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
  <div class="copyright-footer">
    <p>
      本サイトは<a href="https://www.aioniatrpg.com/" target="_blank" rel="noopener noreferrer"
        >「イチ（フシギ製作所）」様が権利を有する「慈悲なきアイオニア」</a
      >の二次創作物です(Ver 1.2対応)。<br />
      本サイトは、あろすてりっくが作成しました。
    </p>
    <button class="button-link" @click="openPrivacyPolicy">プライバシーポリシー</button>
    <div class="build-info" v-if="buildInfo">{{ buildInfo }}</div>
  </div>
</template>
