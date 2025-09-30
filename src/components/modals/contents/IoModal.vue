<template>
  <div class="io-modal">
    <div class="io-modal__section">
      <button class="button-base" @click="$emit('save-local')">
        {{ saveLocalLabel }}
      </button>
      <label class="button-base">
        {{ loadLocalLabel }}
        <input type="file" class="hidden" @change="(e) => $emit('load-local', e)" accept=".json,.txt,.zip" />
      </label>
      <AnimatedButton
        class="button-base"
        :trigger="triggerKey"
        :default-label="outputLabels.default"
        :animating-label="outputLabels.animating"
        :success-label="outputLabels.success"
        :timings="outputTimings"
        @click="$emit('output-cocofolia')"
      />
      <button class="button-base" @click="$emit('print')">
        {{ printLabel }}
      </button>
    </div>
    <div class="io-modal__section io-modal__section--drive">
      <p class="io-modal__description">
        {{ driveDescription }}
      </p>
      <template v-if="!signedIn">
        <button class="button-base" @click="$emit('google-sign-in')">
          {{ signInLabel }}
        </button>
      </template>
      <template v-else>
        <div class="io-modal__drive-actions">
          <button class="button-base" @click="$emit('drive-open')">
            {{ driveOpenLabel }}
          </button>
          <button class="button-base" @click="$emit('drive-save-new')">
            {{ driveNewLabel }}
          </button>
          <button class="button-base" :disabled="!canOverwrite" @click="$emit('drive-save-overwrite')">
            {{ driveOverwriteLabel }}
          </button>
          <button class="button-base button-secondary" @click="$emit('google-sign-out')">
            {{ signOutLabel }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AnimatedButton from '../../common/AnimatedButton.vue';

defineProps({
  signedIn: Boolean,
  canOverwrite: Boolean,
  saveLocalLabel: String,
  loadLocalLabel: String,
  outputLabels: Object,
  outputTimings: Object,
  printLabel: String,
  driveDescription: String,
  driveOpenLabel: String,
  driveNewLabel: String,
  driveOverwriteLabel: String,
  signInLabel: String,
  signOutLabel: String,
});

defineEmits([
  'save-local',
  'load-local',
  'output-cocofolia',
  'print',
  'drive-open',
  'drive-save-new',
  'drive-save-overwrite',
  'google-sign-in',
  'google-sign-out',
]);

const triggerKey = ref(0);
function triggerAnimation() {
  triggerKey.value += 1;
}

function handleCopySuccess(event) {
  if (event.detail.type === 'cocofolia') {
    triggerAnimation();
  }
}

onMounted(() => {
  document.removeEventListener('aionia-copy-success', handleCopySuccess);
  document.addEventListener('aionia-copy-success', handleCopySuccess);
});

onUnmounted(() => {
  document.removeEventListener('aionia-copy-success', handleCopySuccess);
});
</script>

<style scoped>
.io-modal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.io-modal__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.io-modal__section--drive {
  padding-top: 10px;
  border-top: 1px solid var(--color-border, #444);
}

.io-modal__description {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.io-modal__drive-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.button-secondary {
  background: transparent;
  border: 1px solid var(--color-border, #444);
}
</style>
