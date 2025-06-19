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
const buildInfo =
  buildBranch && buildHash && buildDate
    ? `${buildBranch} (${buildHash}) ${buildDate}`
    : '';

async function openPrivacyPolicy() {
  await showModal({
    component: PrivacyPolicyModal,
    title: 'プライバシーポリシー',
    buttons: [{ label: '閉じる', value: 'close', variant: 'secondary' }],
  });
}
</script>

<template>
  <div class="tool-title">Aionia TRPG Character Sheet</div>
  <div class="build-info" v-if="buildInfo">{{ buildInfo }}</div>
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
    <p>
      本サイトは<a href="https://www.aioniatrpg.com/" target="_blank" rel="noopener noreferrer">「イチ（フシギ製作所）」様が権利を有する「慈悲なきアイオニア」</a>の二次創作物です(Ver 1.2対応)。<br />
      本サイトは<a href="https://bright-trpg.github.io/aionia_character_maker/" target="_blank" rel="noopener noreferrer">bright-trpg様作成の「慈悲なきアイオニア　キャラクター作成用ツール」</a>をもとに、あろすてりっくが作成しました。
    </p>
    <button class="button-link" @click="openPrivacyPolicy">プライバシーポリシー</button>
  </div>
</template>
