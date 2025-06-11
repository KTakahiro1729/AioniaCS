<template>
  <div id="character_memo" class="character-memo">
    <div class="box-title">キャラクターメモ</div>
    <div class="box-content">
      <textarea id="character_text" :placeholder="placeholder" v-model="character.memo" class="character-memo-textarea"></textarea>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({ character: Object, placeholder: String });
</script>
