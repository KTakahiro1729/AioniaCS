<template>
  <div class="expiration-options">
    <label><input type="radio" value="24h" v-model="selected" />24時間</label>
    <label><input type="radio" value="7d" v-model="selected" />7日間</label>
    <label><input type="radio" value="never" v-model="selected" />無期限</label>
  </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue';
const selected = ref('never');

defineExpose({ selected });
</script>

<style scoped>
</style>
