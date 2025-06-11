<template>
  <div class="share-dialog-overlay">
    <div class="share-dialog">
      <h2>共有</h2>
      <div class="expiration-options">
        <label><input type="radio" name="expires" value="24h" />24時間</label>
        <label><input type="radio" name="expires" value="7d" />7日間</label>
        <label><input type="radio" name="expires" value="never" checked />無期限</label>
      </div>
      <textarea class="share-url" readonly placeholder="URL" />
      <button class="button-base" @click="$emit('copy')">コピー</button>
      <div class="share-security-warning">
        共有リンクは第三者に渡さないでください。
      </div>
      <button class="button-base" @click="$emit('close')">閉じる</button>
    </div>
  </div>
</template>

<script setup>
// Emits copy and close events
const emit = defineEmits(['close', 'copy']);
</script>

<style scoped>
</style>
