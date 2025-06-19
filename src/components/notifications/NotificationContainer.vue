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
  </div>
</template>

<script setup>
import { useNotificationStore } from '../../stores/notificationStore.js';
import ToastNotification from './ToastNotification.vue';

const store = useNotificationStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

@media (max-width: 768px) {
  .toast-container {
    left: 20px;
    right: 20px;
    max-width: none;
  }
}
</style>
