<template>
  <div class="share-options">
    <section class="share-options__section">
      <p class="share-options__description">{{ shareOptions.description }}</p>
      <div class="share-options__row">
        <label class="share-options__option">
          <input type="checkbox" v-model="includeFull" />
          {{ shareOptions.includeFull }}
        </label>
      </div>
      <p v-if="showTruncateWarning" class="share-options__warning">{{ shareOptions.truncateWarning }}</p>
    </section>
    <button class="button-base share-options__signin" v-if="needSignin" @click="handleSignin">
      {{ shareOptions.signIn }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, defineExpose, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useUiStore } from '../../../stores/uiStore.js';
import { messages } from '../../../locales/ja.js';
const props = defineProps({ longData: Boolean });
const emit = defineEmits(['signin', 'update:canGenerate']);
const includeFull = ref(false);
const uiStore = useUiStore();
const { isSignedIn } = storeToRefs(uiStore);
const shareOptions = messages.share.options;
const needSignin = computed(() => !isSignedIn.value);
const showTruncateWarning = computed(() => props.longData && !includeFull.value);
const canGenerate = computed(() => !needSignin.value);
watchEffect(() => {
  emit('update:canGenerate', canGenerate.value);
});

defineExpose({ includeFull });

function handleSignin() {
  emit('signin');
}
</script>

<style scoped>
.share-options__section {
  margin-bottom: 16px;
}
.share-options__row {
  margin-bottom: 8px;
}
.share-options__warning {
  color: #f88;
}
.share-options__description {
  margin-bottom: 12px;
  color: var(--color-text-muted);
}
.share-options__signin {
  margin-top: 10px;
}
</style>
