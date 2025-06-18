<template>
  <div class="io-modal">
    <button class="button-base button-compact" @click="$emit('print')">印刷</button>
    <button class="button-base button-compact" @click="$emit('cocofolia')">ココフォリア駒出力</button>
    <button
      v-if="props.isSignedIn"
      class="button-base button-compact"
      @click="$emit('local-save')"
    >端末保存</button>
    <label
      v-if="props.isSignedIn"
      class="button-base button-compact"
    >端末読込
      <input type="file" class="hidden" @change="(e) => $emit('local-load', e)" accept=".json,.txt,.zip" />
    </label>
  </div>
</template>

<script setup>
const props = defineProps({ isSignedIn: Boolean });
const emit = defineEmits(['print', 'cocofolia', 'local-save', 'local-load']);
</script>

<style scoped>
.io-modal {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>

