<template>
  <div class="data-check-modal">
    <div v-if="loading">チェック中...</div>
    <div v-else>
      <section v-if="orphans.length">
        <h3>孤立ファイル</h3>
        <div v-for="f in orphans" :key="f.id" class="data-row">
          {{ f.name }}
          <label>
            <input type="radio" :name="f.id" value="register" v-model="orphanChoices[f.id]" />
            登録
          </label>
          <label>
            <input type="radio" :name="f.id" value="delete" v-model="orphanChoices[f.id]" />
            削除
          </label>
        </div>
      </section>
      <section v-if="missing.length">
        <h3>破損ポインタ</h3>
        <div v-for="m in missing" :key="m.id" class="data-row">
          {{ m.name }}
          <label>
            <input type="checkbox" v-model="removeIds" :value="m.id" />
            インデックスから削除
          </label>
        </div>
      </section>
      <button class="button-base" @click="apply">修復</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const props = defineProps({ gdm: Object });
const emit = defineEmits(['done']);
const loading = ref(true);
const orphans = ref([]);
const missing = ref([]);
const orphanChoices = ref({});
const removeIds = ref([]);
onMounted(async () => {
  const res = await props.gdm.scanIntegrity();
  orphans.value = res.orphanFiles;
  missing.value = res.brokenPointers;
  loading.value = false;
});
async function apply() {
  const addIds = [];
  const deleteFileIds = [];
  Object.entries(orphanChoices.value).forEach(([id, action]) => {
    if (action === 'register') addIds.push(id);
    if (action === 'delete') deleteFileIds.push(id);
  });
  await props.gdm.repairIndex({ addIds, removeIds: removeIds.value, deleteFileIds });
  emit('done');
}
</script>

<style scoped>
.data-check-modal {
  color: var(--color-text-normal);
}
.data-row {
  margin-bottom: 8px;
}
</style>
