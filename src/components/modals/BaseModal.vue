<template>
  <transition name="modal">
    <div class="modal-overlay" v-if="modal.isVisible" @click.self="modalStore.hideModal()">
      <div :class="['modal', modal.type ? `modal--${modal.type}` : '']">
        <button class="modal-close close-cross" @click="modalStore.hideModal()">×</button>
        <div class="modal-header box-title" v-if="modal.title">
          <div class="modal-header-left">
            <div class="modal-icon" v-if="modal.type === 'critical'">!</div>
            <div class="modal-title">{{ modal.title }}</div>
          </div>
        </div>
        <div
          class="modal-global-actions sub-box-title"
          v-if="modal.globalActions"
        >
          <component
            :is="modal.globalActions.component"
            v-bind="modal.globalActions.props"
            v-on="modal.globalActions.on"
          />
        </div>
        <div class="modal-content box-content">
          <div class="modal-message" v-if="modal.message">
            {{ modal.message }}
          </div>
          <component
            :is="modal.component"
            v-bind="modal.props"
            v-on="modal.events"
            ref="inner"
          />
          <div class="modal-actions">
            <button
              v-for="(btn, index) in modal.buttons"
              :key="index"
              :class="['modal-button', `modal-button--${btn.variant || 'secondary'}`]"
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
import { useModalStore } from '../../stores/modalStore.js';

const modalStore = useModalStore();
const modal = modalStore;
const inner = ref(null);

function resolve(value) {
  modalStore.resolveModal({ value, component: inner.value });
}
</script>

<style scoped>
</style>
