<template>
  <div class="share-result-modal">
    <p class="share-result-modal__description">{{ description }}</p>
    <label class="share-result-modal__label" :for="inputId">{{ urlLabel }}</label>
    <div class="share-result-modal__field">
      <input
        :id="inputId"
        class="share-result-modal__input"
        type="text"
        :value="shareUrl"
        readonly
      />
      <button type="button" class="button-base share-result-modal__copy" @click="handleCopy">
        {{ copyLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { messages } from '@/i18n/index.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';

const props = defineProps({
  shareUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: () => messages.share.resultModal.description,
  },
  urlLabel: {
    type: String,
    default: () => messages.share.resultModal.urlLabel,
  },
  copyLabel: {
    type: String,
    default: () => messages.share.resultModal.copyLabel,
  },
});

const inputId = `share-url-${Math.random().toString(36).slice(2, 8)}`;
const { showToast, logAndToastError } = useNotifications();

async function handleCopy() {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    const unavailable = messages.share.toast.clipboardUnavailable();
    logAndToastError(new Error(unavailable.message), unavailable, 'share-result-copy');
    return;
  }

  try {
    await navigator.clipboard.writeText(props.shareUrl);
    showToast({ type: 'success', ...messages.share.resultModal.copySuccess() });
  } catch (error) {
    logAndToastError(error, messages.share.resultModal.copyError(), 'share-result-copy');
  }
}
</script>

<style scoped>
.share-result-modal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-result-modal__description {
  margin: 0;
  color: var(--color-text-primary, #f0f0f0);
}

.share-result-modal__label {
  font-weight: bold;
  color: var(--color-text-primary, #f0f0f0);
}

.share-result-modal__field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.share-result-modal__input {
  flex: 1;
  padding: 8px;
  background: #1f1f1f;
  color: var(--color-text-primary, #f0f0f0);
  border: 1px solid #444;
  border-radius: 4px;
}

.share-result-modal__input:focus {
  outline: 2px solid var(--color-accent, #9b59b6);
  outline-offset: 2px;
}

.share-result-modal__copy {
  white-space: nowrap;
}
</style>
