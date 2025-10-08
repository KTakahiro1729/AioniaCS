<template>
  <div class="share-options">
    <p class="share-options__description">{{ shareTexts.description }}</p>
    <div v-if="!isSignedIn" class="share-options__signin-block">
      <p class="share-options__note">{{ shareTexts.signInRequired }}</p>
      <button class="button-base share-options__signin" @click="handleSignin">
        {{ shareTexts.signIn }}
      </button>
    </div>
    <div v-else class="share-options__link-block">
      <label class="share-options__field">
        <span class="share-options__field-label">{{ shareTexts.linkLabel }}</span>
        <input
          ref="linkInput"
          class="share-options__input"
          type="text"
          :value="shareLink"
          readonly
          @focus="selectLink"
        />
      </label>
      <div class="share-options__actions">
        <button class="button-base share-options__copy" :disabled="!shareLink" @click="handleCopy">
          {{ shareTexts.copy }}
        </button>
      </div>
      <p v-if="!shareLink && !isGenerating" class="share-options__note">{{ shareTexts.empty }}</p>
      <p v-if="isGenerating" class="share-options__note">{{ shareTexts.generating }}</p>
    </div>
    <button
      class="button-base share-options__generate"
      :disabled="!isSignedIn || isGenerating"
      @click="handleGenerate"
    >
      {{ shareTexts.generate }}
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUiStore } from '../../../stores/uiStore.js';
import { messages } from '../../../locales/ja.js';

const props = defineProps({
  shareLink: { type: String, default: '' },
  isGenerating: { type: Boolean, default: false },
});

const emit = defineEmits(['signin', 'share', 'copy']);

const uiStore = useUiStore();
const { isSignedIn } = storeToRefs(uiStore);
const linkInput = ref(null);
const shareTexts = messages.share.panel;

const shareLink = computed(() => props.shareLink);

watch(
  () => props.shareLink,
  (value) => {
    if (value && linkInput.value) {
      linkInput.value.select();
    }
  },
);

function handleSignin() {
  emit('signin');
}

function handleGenerate() {
  emit('share');
}

function handleCopy() {
  if (!shareLink.value) return;
  emit('copy');
}

function selectLink(event) {
  event.target.select();
}
</script>

<style scoped>
.share-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-options__description {
  margin: 0;
  color: var(--color-text-muted);
}

.share-options__signin-block,
.share-options__link-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-options__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.share-options__field-label {
  font-size: 14px;
  color: var(--color-text-muted);
}

.share-options__input {
  width: 100%;
  padding: 6px 8px;
  background: var(--color-background-input);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.share-options__actions {
  display: flex;
  gap: 8px;
}

.share-options__copy,
.share-options__signin,
.share-options__generate {
  align-self: flex-start;
}

.share-options__note {
  margin: 0;
  color: var(--color-text-muted);
}

.share-options__generate {
  margin-top: 8px;
}
</style>
