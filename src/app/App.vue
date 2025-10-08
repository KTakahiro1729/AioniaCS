<script setup>
import { watch } from 'vue';
import { RouterView } from 'vue-router';
import BaseModal from '@/features/modals/components/BaseModal.vue';
import NotificationContainer from '@/features/notifications/components/NotificationContainer.vue';
import { useModalStore } from '@/features/modals/stores/modalStore.js';

const modalStore = useModalStore();

watch(
  () => modalStore.isVisible,
  (isVisible) => {
    if (isVisible) {
      document.body.classList.add('is-modal-open');
    } else {
      document.body.classList.remove('is-modal-open');
    }
  },
  { immediate: true },
);
</script>

<template>
  <RouterView />
  <BaseModal />
  <NotificationContainer />
</template>
