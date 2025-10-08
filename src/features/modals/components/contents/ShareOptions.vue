<template>
  <div class="share-modal">
    <div v-if="!isSignedIn" class="share-modal__signin">
      <p class="share-modal__message">{{ shareMessages.signInMessage }}</p>
      <button class="button-base share-modal__signin-button" @click="handleSigninClick">
        {{ shareMessages.signInButton }}
      </button>
    </div>
    <div v-else class="share-modal__content">
      <p class="share-modal__message">{{ shareMessages.instructions }}</p>
      <div class="share-modal__field">
        <input
          ref="inputRef"
          class="share-modal__input"
          type="text"
          :value="shareLink"
          readonly
          placeholder="https://"
          @focus="$event.target.select()"
        />
        <button class="button-base share-modal__copy" :disabled="!canCopy" @click="copyShareLink">
          {{ shareMessages.copy }}
        </button>
      </div>
      <p v-if="isLoading" class="share-modal__status">{{ shareMessages.generating }}</p>
      <p v-else-if="shareLink" class="share-modal__status share-modal__status--success">
        {{ shareMessages.ready }}
      </p>
      <div v-else-if="error" class="share-modal__error">
        <p>{{ error }}</p>
        <button class="button-base share-modal__retry" @click="retryShare">{{ shareMessages.retry }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useShare } from '@/features/cloud-sync/composables/useShare.js';
import { messages } from '@/locales/ja.js';

const props = defineProps({
  dataManager: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['signin']);

const uiStore = useUiStore();
const { createShareLink, copyLink } = useShare(props.dataManager);

const shareLink = ref('');
const isLoading = ref(false);
const error = ref('');
const hasAttempted = ref(false);
const inputRef = ref(null);

const shareMessages = messages.share.modal;
const isSignedIn = computed(() => uiStore.isSignedIn);
const canCopy = computed(() => Boolean(shareLink.value) && !isLoading.value);

async function beginShare() {
  if (!isSignedIn.value || isLoading.value) {
    return;
  }
  isLoading.value = true;
  error.value = '';
  hasAttempted.value = true;
  try {
    const link = await createShareLink();
    shareLink.value = link;
    queueMicrotask(() => {
      if (inputRef.value) {
        inputRef.value.focus();
        inputRef.value.select();
      }
    });
  } catch (err) {
    shareLink.value = '';
    error.value = err?.message || shareMessages.errorDefault;
  } finally {
    isLoading.value = false;
  }
}

function handleSigninClick() {
  emit('signin');
}

function copyShareLink() {
  if (!shareLink.value) return;
  copyLink(shareLink.value);
}

function retryShare() {
  beginShare();
}

watch(isSignedIn, (signedIn, wasSignedIn) => {
  if (signedIn && !wasSignedIn) {
    beginShare();
  } else if (!signedIn) {
    shareLink.value = '';
    error.value = '';
    hasAttempted.value = false;
  }
});

onMounted(() => {
  if (isSignedIn.value && !hasAttempted.value) {
    beginShare();
  }
});
</script>

<style scoped>
.share-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.share-modal__message {
  margin: 0;
  line-height: 1.5;
}

.share-modal__signin {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-modal__signin-button {
  align-self: flex-start;
}

.share-modal__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-modal__field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.share-modal__input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border, #444);
  background: var(--color-surface, #111);
  color: var(--color-text, #eee);
}

.share-modal__copy,
.share-modal__retry {
  white-space: nowrap;
}

.share-modal__status {
  margin: 0;
  color: var(--color-text-muted, #aaa);
}

.share-modal__status--success {
  color: var(--color-accent, #8fbcbb);
}

.share-modal__error {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-error, #f88);
}
</style>
