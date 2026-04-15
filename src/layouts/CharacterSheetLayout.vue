<script setup>
import { useCharacterStore } from '../stores/characterStore.js';
import { useModal } from '../composables/useModal.js';
import PrivacyPolicyModal from '../components/modals/contents/PrivacyPolicyModal.vue';

import CharacterBasicInfo from '../components/sections/CharacterBasicInfo.vue';
import ScarWeaknessSection from '../components/sections/ScarWeaknessSection.vue';
import SkillsSection from '../components/sections/SkillsSection.vue';
import SpecialSkillsSection from '../components/sections/SpecialSkillsSection.vue';
import ItemsSection from '../components/sections/ItemsSection.vue';
import CharacterMemoSection from '../components/sections/CharacterMemoSection.vue';
import AdventureLogSection from '../components/sections/AdventureLogSection.vue';

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
    <ScarWeaknessSection />
    <SkillsSection />
    <SpecialSkillsSection />
    <ItemsSection />
    <CharacterMemoSection />
    <AdventureLogSection />
  </div>
  <div class="copyright-footer">
    <button class="button-link" @click="openPrivacyPolicy">プライバシーポリシー</button>
    <div class="build-info" v-if="buildInfo">{{ buildInfo }}</div>
  </div>
</template>
