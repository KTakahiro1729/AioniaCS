<template>
  <transition name="modal-fade">
    <div class="modal-overlay" v-if="modal.isVisible" @click.self="modalStore.hideModal()">
      <div :class="['modal', modal.type ? `modal--${modal.type}` : '', modal.size ? `modal--${modal.size}` : '']">
        <button class="modal-close close-cross" @click="modalStore.hideModal()">×</button>
        <div class="modal-header box-title" v-if="modal.title">
          <div class="modal-header-left">
            <div class="modal-icon" v-if="modal.type === 'critical'">!</div>
            <div class="modal-title">{{ modal.title }}</div>
          </div>
          <div class="modal-header-actions" data-slot="header-actions">
            <slot name="header-actions" />
          </div>
        </div>
        <div class="modal-content box-content">
          <div class="modal-message" v-if="modal.message">
            {{ modal.message }}
          </div>
          <component :is="modal.component" v-bind="modal.props" v-on="modal.events" ref="inner" />
          <div class="modal-actions">
            <button
              v-for="(btn, index) in modal.buttons"
              :key="index"
              :class="['modal-button', `modal-button--${btn.variant || 'secondary'}`]"
              :disabled="btn.disabled"
              @click="resolve(btn.value)"
            >
              {{ btn.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';
import { useModalStore } from '@/features/modals/stores/modalStore.js';

const modalStore = useModalStore();
const modal = modalStore;
const inner = ref(null);

function resolve(value) {
  modalStore.resolveModal({ value, component: inner.value });
}
</script>

<style scoped>
.box-content {
  border: none;
  padding: 14px;
}

.modal-header {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-right: 36px;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
}
</style>
