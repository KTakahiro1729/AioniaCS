<template>
  <div class="share-options">
    <div class="share-options__row">
      <label><input type="radio" value="snapshot" v-model="type" />スナップショット</label>
      <label><input type="radio" value="dynamic" v-model="type" />ライブリンク</label>
    </div>
    <div class="share-options__row">
      <label><input type="checkbox" v-model="includeFull" />全文・画像を含める</label>
      <p v-if="showTruncateWarning" class="share-options__warning">全文を含めないと内容が省略されます</p>
    </div>
    <div class="share-options__row">
      <label>パスワード <input type="text" v-model="password" /></label>
    </div>
    <div class="share-options__row">
      <label>有効期限
        <select v-model="expires">
          <option value="1">1日</option>
          <option value="7">7日</option>
          <option value="0">無期限</option>
        </select>
      </label>
    </div>
    <button v-if="needSignin" @click="handleSignin">Google Drive にサインイン</button>
  </div>
</template>

<script setup>
import { ref, computed, defineExpose } from 'vue';
const props = defineProps({ signedIn: Boolean, longData: Boolean });
const emit = defineEmits(['signin']);
const type = ref('snapshot');
const includeFull = ref(false);
const password = ref('');
const expires = ref('0');
const needSignin = computed(() => (type.value === 'dynamic' || includeFull.value) && !props.signedIn);
const showTruncateWarning = computed(() => props.longData && !includeFull.value);

defineExpose({ type, includeFull, password, expires });

function handleSignin() {
  if (window.__driveSignIn) window.__driveSignIn();
}
</script>

<style scoped>
.share-options__warning {
  color: #f88;
}
</style>
