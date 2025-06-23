<template>
  <div class="share-options">
    <section class="share-options__section">
      <h3 class="share-options__heading">今後の変更を反映しますか？</h3>
      <div class="share-options__row">
        <label class="share-options__option"> <input type="radio" value="snapshot" v-model="type" />反映しない </label>
      </div>
      <div class="share-options__row">
        <label class="share-options__option">
          <input type="radio" value="dynamic" v-model="type" />反映する
          <div class="share-options__note">Google Drive連携が必要です</div>
        </label>
      </div>
    </section>
    <section class="share-options__section">
      <h3 class="share-options__heading">追加オプション</h3>
      <div class="share-options__row">
        <label class="share-options__option">
          <input type="checkbox" v-model="includeFull" />画像・メモ（長文の場合）を含める
          <div class="share-options__note">Google Drive連携が必要です</div>
        </label>
      </div>
      <p v-if="showTruncateWarning" class="share-options__warning">内容が一部省略される可能性があります</p>
      <div class="share-options__row">
        <label class="share-options__option"> <input type="checkbox" v-model="enablePassword" />パスワード保護 </label>
      </div>
      <div class="share-options__row" v-if="enablePassword">
        <input type="text" v-model="password" class="share-options__password-input" />
      </div>
      <div class="share-options__row">
        <label class="share-options__option"
          >有効期限
          <select v-model="expires">
            <option value="1">1日</option>
            <option value="7">7日</option>
            <option value="0">無期限</option>
          </select>
        </label>
      </div>
    </section>
    <button class="button-base share-options__signin" v-if="needSignin" @click="handleSignin">Google Drive にサインイン</button>
  </div>
</template>

<script setup>
import { ref, computed, defineExpose, watchEffect } from 'vue';
const props = defineProps({ signedIn: Boolean, longData: Boolean });
const emit = defineEmits(['signin', 'update:canGenerate']);
const type = ref('snapshot');
const includeFull = ref(false);
const enablePassword = ref(false);
const password = ref('');
const expires = ref('0');
const needSignin = computed(() => (type.value === 'dynamic' || includeFull.value) && !props.signedIn);
const showTruncateWarning = computed(() => props.longData && !includeFull.value);
const canGenerate = computed(() => !needSignin.value);
watchEffect(() => {
  emit('update:canGenerate', canGenerate.value);
});

defineExpose({ type, includeFull, password, expires, enablePassword });

function handleSignin() {
  if (window.__driveSignIn) window.__driveSignIn();
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
  margin-left: 50px;
  color: var(--color-text-muted);
}
.share-options__warning {
  color: #f88;
}
.share-options__signin {
  margin-top: 10px;
}
</style>
