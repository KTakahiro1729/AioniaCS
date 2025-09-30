<template>
  <div class="io-modal">
    <template v-if="!signedIn">
      <p class="io-modal__description">
        {{ description }}
      </p>
      <button class="button-base io-modal__primary" @click="$emit('login')">
        {{ loginLabel }}
      </button>
    </template>
    <template v-else>
      <p class="io-modal__folder-info">{{ folderMessage }}</p>
      <div class="io-modal__actions">
        <button class="button-base" @click="$emit('open')">
          {{ openLabel }}
        </button>
        <button class="button-base" @click="$emit('save-new')">
          {{ saveNewLabel }}
        </button>
        <button class="button-base" :disabled="!canOverwrite" @click="$emit('overwrite')">
          {{ overwriteLabel }}
        </button>
        <button class="button-base button-secondary" @click="$emit('logout')">
          {{ logoutLabel }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  signedIn: Boolean,
  canOverwrite: Boolean,
  description: String,
  folderName: String,
  loginLabel: String,
  openLabel: String,
  saveNewLabel: String,
  overwriteLabel: String,
  logoutLabel: String,
});

defineEmits(['login', 'open', 'save-new', 'overwrite', 'logout']);

const folderMessage = computed(() => `${props.folderName} にキャラクターシートを保存します。`);
</script>

<style scoped>
.io-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.io-modal__description {
  margin: 0;
  line-height: 1.6;
  text-align: center;
}

.io-modal__primary {
  align-self: center;
  min-width: 220px;
}

.io-modal__folder-info {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.8;
  text-align: center;
}

.io-modal__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.io-modal__actions .button-base[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
