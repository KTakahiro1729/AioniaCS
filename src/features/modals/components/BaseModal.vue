<template>
  <transition name="modal-fade" @after-leave="onAfterLeave">
    <div class="modal-overlay" v-if="modalStore.isVisible" @click.self="modalStore.hideModal()">
      <div :class="['modal', modalStore.type ? `modal--${modalStore.type}` : '', modalStore.size ? `modal--${modalStore.size}` : '']">
        <button class="modal-close close-cross" @click="modalStore.hideModal()">×</button>
        <div class="modal-header box-title" v-if="modalStore.title">
          <div class="modal-header-left">
            <div class="modal-icon" v-if="modalStore.type === 'critical'">!</div>
            <div class="modal-title">{{ modalStore.title }}</div>
          </div>
          <div class="modal-header-actions" data-slot="header-actions">
            <slot name="header-actions" />
          </div>
        </div>
        <div class="modal-content box-content">
          <div class="modal-message" v-if="modalStore.message">
            {{ modalStore.message }}
          </div>
          <component :is="modalStore.component" v-bind="modalStore.props" v-on="modalStore.events" ref="inner" />
          <div class="modal-actions">
            <button
              v-for="(btn, index) in modalStore.buttons"
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
const inner = ref(null);

function resolve(value) {
  modalStore.resolveModal({ value, component: inner.value });
}

function onAfterLeave() {
  // Reset store state only after the leave transition has fully completed,
  // so child components (including Teleport targets) can cleanly unmount first.
  // Guard against the case where a new modal was opened during the transition.
  if (!modalStore.isVisible) {
    modalStore._resetState();
  }
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
  padding-right: 40px;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
