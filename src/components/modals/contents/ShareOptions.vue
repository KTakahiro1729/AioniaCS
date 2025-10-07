<template>
  <div class="share-options">
    <section class="share-options__section">
      <h3 class="share-options__heading">{{ shareOptions.title }}</h3>
      <p class="share-options__description">{{ shareOptions.description }}</p>
      <p class="share-options__note">{{ shareOptions.folderHint }}</p>
      <p v-if="props.longData" class="share-options__note">{{ shareOptions.includesImages }}</p>
    </section>
    <p v-if="needSignin" class="share-options__warning">{{ shareOptions.needSignIn }}</p>
    <button class="button-base share-options__signin" v-if="needSignin" @click="handleSignin">
      {{ shareOptions.signIn }}
    </button>
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useUiStore } from '../../../stores/uiStore.js';
import { messages } from '../../../locales/ja.js';
const props = defineProps({ longData: Boolean });
const emit = defineEmits(['signin', 'update:canGenerate']);
const uiStore = useUiStore();
const { isSignedIn } = storeToRefs(uiStore);
const shareOptions = messages.share.options;
const needSignin = computed(() => !isSignedIn.value);
const canGenerate = computed(() => !needSignin.value);
watchEffect(() => {
  emit('update:canGenerate', canGenerate.value);
});

function handleSignin() {
  emit('signin');
}
</script>

<style scoped>
.share-options__section {
  margin-bottom: 16px;
}
.share-options__heading {
  margin-bottom: 8px;
}
.share-options__note {
  margin: 4px 0;
  color: var(--color-text-muted);
}
.share-options__warning {
  color: #f88;
  margin-bottom: 12px;
}
.share-options__signin {
  margin-top: 10px;
}
.share-options__description {
  margin: 0 0 8px;
}
</style>
