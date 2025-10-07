<template>
  <div class="share-options">
    <section class="share-options__section">
      <h3 class="share-options__heading">{{ shareOptions.reflection.title }}</h3>
      <div class="share-options__row">
        <label class="share-options__option">
          <input type="radio" value="snapshot" v-model="type" />
          {{ shareOptions.reflection.choices.snapshot }}
        </label>
      </div>
      <div class="share-options__row">
        <label class="share-options__option">
          <input type="radio" value="dynamic" v-model="type" />
          {{ shareOptions.reflection.choices.dynamic }}
        </label>
      </div>
      <div class="share-options__note">{{ shareOptions.reflection.driveRequired }}</div>
    </section>
    <section class="share-options__section">
      <h3 class="share-options__heading">{{ shareOptions.additional.title }}</h3>
      <div class="share-options__row">
        <label class="share-options__option">
          <input type="checkbox" v-model="enablePassword" />
          {{ shareOptions.additional.enablePassword }}
        </label>
      </div>
      <div class="share-options__row" v-if="enablePassword">
        <input
          type="text"
          v-model="password"
          class="share-options__password-input"
          :placeholder="shareOptions.additional.passwordPlaceholder"
        />
      </div>
      <div class="share-options__row">
        <label class="share-options__option"
          >{{ shareOptions.additional.expires.label }}
          <select v-model="expires">
            <option value="1">{{ shareOptions.additional.expires.options[1] }}</option>
            <option value="7">{{ shareOptions.additional.expires.options[7] }}</option>
            <option value="0">{{ shareOptions.additional.expires.options[0] }}</option>
          </select>
        </label>
      </div>
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
const emit = defineEmits(['signin', 'update:canGenerate']);
const type = ref('snapshot');
const enablePassword = ref(false);
const password = ref('');
const expires = ref('0');
const uiStore = useUiStore();
const { isSignedIn } = storeToRefs(uiStore);
const shareOptions = messages.share.options;
const needSignin = computed(() => !isSignedIn.value);
const canGenerate = computed(() => !needSignin.value);
watchEffect(() => {
  emit('update:canGenerate', canGenerate.value);
});

defineExpose({ type, password, expires, enablePassword });

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
.share-options__row {
  margin-bottom: 8px;
}
.share-options__note {
  margin-left: 4px;
  color: var(--color-text-muted);
}
.share-options__signin {
  margin-top: 10px;
}
</style>
