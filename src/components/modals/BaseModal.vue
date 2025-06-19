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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    ellipse at center,
    rgb(0 0 0 / 80%) 0%,
    rgb(0 0 0 / 95%) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(3px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all 0.3s ease;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  opacity: 0;
  transform: translateY(20px);
}

.modal {
  background: linear-gradient(
    145deg,
    var(--color-panel-header) 0%,
    rgb(31 31 31 / 98%) 100%
  );
  border: 2px solid var(--color-border-normal);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow:
    0 20px 60px rgb(0 0 0 / 80%),
    0 0 0 1px rgb(192 154 105 / 10%),
    inset 0 1px 0 rgb(255 255 255 / 5%);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: var(--color-accent-light);
}

.modal--critical::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--color-critical) 0%,
    var(--color-critical-light) 50%,
    var(--color-critical) 100%
  );
  border-radius: 12px 12px 0 0;
  box-shadow: 0 0 10px var(--color-critical-glow);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-global-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 0;
}

.modal-global-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 0;
  background-color: transparent;
  justify-content: flex-end;
}

.modal-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #fff;
  font-size: 18px;
  position: relative;
}

.modal--critical .modal-icon {
  background-color: var(--color-critical-light);
  color: var(--color-critical-glow);
  animation: pulseGlow 2s ease-in-out infinite alternate;
}

.modal-title {
  font-size: 1.3em;
  font-weight: 700;
  color: var(--color-text-normal);
}

.modal-content {
  display: flex;
}

.modal-message {
  margin-bottom: 25px;
  color: var(--color-text-muted);
  line-height: 1.6;
  white-space: pre-wrap;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  transition: all 0.3s ease;
}

.modal-button--primary {
  background-color: var(--color-accent);
  color: var(--color-background);
}

.modal-button--primary:hover {
  background-color: var(--color-accent-light);
}

.modal-button--secondary {
  background-color: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-normal);
}

.modal-button--secondary:hover {
  background-color: var(--color-panel-body);
  color: var(--color-text-normal);
}

@keyframes pulseGlow {
  from {
    box-shadow: 0 0 20px var(--color-critical-glow);
  }
  to {
    box-shadow:
      0 0 30px var(--color-critical-glow),
      0 0 40px rgb(139 68 68 / 30%);
  }
}

@media (max-width: 768px) {
  .modal {
    margin: 20px;
    width: calc(100% - 40px);
  }
}
</style>
