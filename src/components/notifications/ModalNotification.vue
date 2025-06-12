<template>
  <Transition name="modal">
    <div v-if="modal.isVisible" class="modal-overlay">
      <div :class="['modal', modal.type ? `modal--${modal.type}` : '']">
        <div class="modal-header" v-if="modal.title">
          <div class="modal-icon" v-if="modal.icon">{{ modal.icon }}</div>
          <div class="modal-title">{{ modal.title }}</div>
        </div>
        <div class="modal-message">{{ modal.message }}</div>
        <div class="modal-actions">
          <button
            v-for="btn in modal.buttons"
            :key="btn.value"
            :class="['modal-button', `modal-button--${btn.variant || 'primary'}`]"
            @click="handle(btn.value)"
          >
            {{ btn.label }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../../stores/notificationStore.js'

const store = useNotificationStore()
const { modal } = storeToRefs(store)

function handle(value) {
  store.hideModal(value)
}
</script>

<style scoped>
</style>
