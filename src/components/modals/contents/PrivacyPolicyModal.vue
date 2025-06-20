<template>
  <div class="privacy-policy-modal__content" v-html="sanitized" />
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import policyText from '../../../../PRIVACY_POLICY.md?raw';

const sanitized = computed(() => DOMPurify.sanitize(marked.parse(policyText)));
</script>

<style scoped>
.privacy-policy-modal__content {
  max-height: 60vh;
  overflow-y: auto;
  color: var(--color-text-normal);
}
</style>

