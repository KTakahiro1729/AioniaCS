<template>
  <div :class="['toast', `toast--${toast.type}`]">
    <div class="toast-icon">!</div>
    <div class="toast-content">
      <div class="toast-title">{{ toast.title }}</div>
      <div class="toast-message">{{ toast.message }}</div>
    </div>
    <button class="toast-close" @click="$emit('close')">×</button>
    <div class="toast-progress" v-if="toast.duration && toast.duration > 0"></div>
  </div>
</template>

<script setup>
const props = defineProps({ toast: Object });
const emit = defineEmits(['close']);
</script>

<style scoped>
.toast {
  background: linear-gradient(
    135deg,
    var(--color-panel-header) 0%,
    rgb(42 42 42 / 95%) 100%
  );
  border: 1px solid var(--color-border-normal);
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow:
    0 8px 32px rgb(0 0 0 / 80%),
    inset 0 1px 0 rgb(255 255 255 / 5%);
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  box-shadow: 0 0 8px currentcolor;
}

.toast--success::before {
  background: linear-gradient(
    180deg,
    var(--color-success) 0%,
    var(--color-success-light) 100%
  );
  color: var(--color-success-glow);
}

.toast--warning::before {
  background: linear-gradient(
    180deg,
    var(--color-warning) 0%,
    var(--color-warning-light) 100%
  );
  color: var(--color-warning-glow);
}

.toast--error::before {
  background: linear-gradient(
    180deg,
    var(--color-error) 0%,
    var(--color-error-light) 100%
  );
  color: var(--color-error-glow);
}

.toast--info::before {
  background: linear-gradient(
    180deg,
    var(--color-info) 0%,
    var(--color-info-light) 100%
  );
  color: var(--color-info-glow);
}

.toast-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #fff;
  flex-shrink: 0;
  position: relative;
}

.toast--success .toast-icon {
  background-color: var(--color-success-light);
  color: var(--color-success-glow);
  box-shadow: 0 0 12px var(--color-success-glow);
}

.toast--warning .toast-icon {
  background-color: var(--color-warning-light);
  color: var(--color-warning-glow);
  box-shadow: 0 0 12px var(--color-warning-glow);
}

.toast--error .toast-icon {
  background-color: var(--color-error-light);
  color: var(--color-error-glow);
  box-shadow: 0 0 12px var(--color-error-glow);
}

.toast--info .toast-icon {
  background-color: var(--color-info-light);
  color: var(--color-info-glow);
  box-shadow: 0 0 12px var(--color-info-glow);
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--color-text-normal);
}

.toast-message {
  color: var(--color-text-muted);
  font-size: 0.9em;
}

.toast-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.toast-close:hover {
  background-color: rgb(255 255 255 / 10%);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    rgb(192 154 105 / 80%) 0%,
    rgb(228 202 168 / 60%) 50%,
    rgb(192 154 105 / 40%) 100%
  );
  box-shadow: 0 0 6px rgb(192 154 105 / 50%);
  animation: progressBar 5s linear forwards;
}

@keyframes progressBar {
  from {
    width: 100%;
    opacity: 1;
  }
  to {
    width: 0%;
    opacity: 0.3;
  }
}
</style>
