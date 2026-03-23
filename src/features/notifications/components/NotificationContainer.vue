<template>
  <div>
    <transition-group name="toast" tag="div" class="toast-container">
      <ToastNotification v-for="toast in store.toasts" :key="toast.id" :toast="toast" @close="store.removeToast(toast.id)" />
    </transition-group>
  </div>
</template>

<script setup>
import { useNotificationStore } from '@/features/notifications/stores/notificationStore.js';
import ToastNotification from './ToastNotification.vue';

const store = useNotificationStore();
</script>

<style scoped></style>
