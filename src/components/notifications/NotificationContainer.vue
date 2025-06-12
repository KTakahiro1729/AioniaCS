<template>
  <div>
    <transition-group name="toast" tag="div" class="toast-container">
      <ToastNotification
        v-for="toast in store.toasts"
        :key="toast.id"
        :toast="toast"
        @close="store.removeToast(toast.id)"
      />
    </transition-group>
    <ModalNotification />
  </div>
</template>

<script setup>
import { useNotificationStore } from '../../stores/notificationStore.js';
import ToastNotification from './ToastNotification.vue';
import ModalNotification from './ModalNotification.vue';

const store = useNotificationStore();
</script>

<style scoped>
</style>
