<script setup>
import PrivacyPolicyModal from '@/features/modals/components/contents/PrivacyPolicyModal.vue';
import { useModal } from '@/features/modals/composables/useModal.js';

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

<style scoped>
.copyright-footer {
  text-align: center;
  padding: 15px;
  font-size: 0.8em;
  color: var(--color-text-muted);
  background-color: var(--color-background);
  border-top: 1px solid var(--color-panel-header);
  margin-top: 25px;
  box-sizing: border-box;
}

.copyright-footer p {
  margin: 0.2em 0;
}

.build-info {
  margin-left: auto;
  font-size: 0.8em;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
