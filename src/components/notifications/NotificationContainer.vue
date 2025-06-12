<template>
  <div>
    <div class="toast-container">
      <TransitionGroup name="toast">
        <ToastNotification
          v-for="t in toasts"
          :key="t.id"
          :toast="t"
          @close="removeToast(t.id)"
        />
      </TransitionGroup>
    </div>
    <ModalNotification />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../../stores/notificationStore.js'
import ToastNotification from './ToastNotification.vue'
import ModalNotification from './ModalNotification.vue'

const store = useNotificationStore()
const { toasts } = storeToRefs(store)
const { removeToast } = store
</script>

<style scoped>
</style>
