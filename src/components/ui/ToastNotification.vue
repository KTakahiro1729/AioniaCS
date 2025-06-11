<template>
  <div class="toast-container">
    <transition-group name="toast-item" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['toast-notification', `toast-notification--${notification.type || 'info'}`]"
        role="alert"
        aria-live="assertive"
      >
        <div class="toast-notification__content">
          <p class="toast-notification__message">{{ notification.message }}</p>
          <button
            v-if="notification.action"
            @click="notification.action.handler"
            class="toast-notification__action"
          >
            {{ notification.action.label }}
          </button>
        </div>
        <button @click="removeNotification(notification.id)" class="toast-notification__close" aria-label="閉じる">×</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotificationStore } from '../../stores/notificationStore.js';
import { storeToRefs } from 'pinia';

const notificationStore = useNotificationStore();
const { notifications } = storeToRefs(notificationStore);
const { removeNotification } = notificationStore;
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast-item-enter-active,
.toast-item-leave-active {
  transition: all 0.5s ease;
}
.toast-item-enter-from,
.toast-item-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
