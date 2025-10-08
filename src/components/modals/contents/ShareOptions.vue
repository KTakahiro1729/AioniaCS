<template>
  <div class="share-modal">
    <div v-if="!isSignedIn" class="share-modal__signin">
      <p class="share-modal__description">{{ shareMessages.signInRequired }}</p>
      <button class="button-base" type="button" @click="handleSignin">{{ shareMessages.signIn }}</button>
    </div>
    <div v-else class="share-modal__content">
      <label class="share-modal__label" for="share-link">{{ shareMessages.linkLabel }}</label>
      <input
        id="share-link"
        ref="linkInput"
        class="share-modal__input"
        type="text"
        :value="shareLink"
        readonly
        :placeholder="shareMessages.linkPlaceholder"
        @focus="selectLink"
      />
      <div class="share-modal__actions">
        <button class="button-base button-base--primary" type="button" :disabled="isGenerating" @click="emitShare">
          <span v-if="isGenerating" class="share-modal__spinner"></span>
          {{ shareMessages.shareButton }}
        </button>
        <button class="button-base" type="button" :disabled="!canCopy" @click="emitCopy">{{ shareMessages.copyButton }}</button>
      </div>
      <p v-if="isGenerating" class="share-modal__status">{{ shareMessages.generating }}</p>
      <p v-else-if="shareLink" class="share-modal__status">{{ shareMessages.generated }}</p>
      <p v-else class="share-modal__status">{{ shareMessages.empty }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUiStore } from '../../../stores/uiStore.js';
import { messages } from '../../../locales/ja.js';

const props = defineProps({
  shareLink: {
    type: String,
    default: '',
  },
  isGenerating: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['signin', 'share', 'copy']);

const uiStore = useUiStore();
const { isSignedIn } = storeToRefs(uiStore);
const linkInput = ref(null);
const shareMessages = messages.share.modal;

const canCopy = computed(() => Boolean(props.shareLink) && !props.isGenerating);

watch(
  () => props.shareLink,
  (link) => {
    if (link && linkInput.value) {
      linkInput.value.select();
    }
  },
);

function handleSignin() {
  emit('signin');
}

function emitShare() {
  emit('share');
}

function emitCopy() {
  if (!canCopy.value) return;
  emit('copy', props.shareLink);
}

function selectLink(event) {
  event.target?.select?.();
}
</script>

<style scoped>
.share-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.share-modal__signin {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.share-modal__description {
  margin: 0;
  color: var(--color-text-default);
}

.share-modal__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-modal__label {
  font-weight: bold;
}

.share-modal__input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background-color: #111;
  color: var(--color-text-default);
}

.share-modal__actions {
  display: flex;
  gap: 8px;
}

.share-modal__status {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.share-modal__spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  margin-right: 6px;
  animation: share-spin 1s linear infinite;
  vertical-align: middle;
}

@keyframes share-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
