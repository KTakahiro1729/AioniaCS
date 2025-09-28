<template>
  <transition name="modal-fade">
    <div v-if="modalStore.isVisible && modalStore.currentModal" class="modal-overlay" @click.self="handleClose">
      <div :class="['modal', modalTypeClass]" :style="modalStore.modalStyles">
        <header class="modal-header box-title">
          <div class="modal-header__title">{{ modalTitle }}</div>
          <div class="modal-header__actions">
            <component v-if="headerActions" :is="headerActions" />
            <button class="modal-close close-cross" type="button" @click="handleClose">&times;</button>
          </div>
        </header>
        <section class="modal-body box-content">
          <component v-if="modalComponent" :is="modalComponent" v-bind="modalProps" v-on="modalEvents" ref="inner" />
        </section>
        <footer v-if="modalButtons.length" class="modal-footer">
          <button
            v-for="(btn, index) in modalButtons"
            :key="index"
            :class="['modal-button', `modal-button--${btn.variant || 'secondary'}`]"
            :disabled="btn.disabled"
            type="button"
            @click="resolve(btn.value)"
          >
            {{ btn.label }}
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useModalStore } from '../../stores/modalStore.js';

const modalStore = useModalStore();
const inner = ref(null);

const modalTitle = computed(() => modalStore.currentModal?.title ?? '');
function unwrapMaybeRef(value) {
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }
  return value ?? null;
}

const modalComponent = computed(() => unwrapMaybeRef(modalStore.currentModal?.component));
const headerActions = computed(() => unwrapMaybeRef(modalStore.currentModal?.headerActions));
const modalProps = computed(() => modalStore.currentModal?.props ?? {});
const modalEvents = computed(() => modalStore.currentModal?.on ?? {});
const modalButtons = computed(() => modalStore.currentModal?.buttons ?? []);
const modalTypeClass = computed(() => (modalStore.currentModal?.type ? `modal--${modalStore.currentModal.type}` : ''));

function resolve(value) {
  modalStore.resolveModal({ value, component: inner.value });
}

function handleClose() {
  modalStore.hideModal();
}
</script>

<style scoped>
.box-content {
  border: none;
  padding: 14px;
}

.sub-box-title {
  margin: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 44px;
}

.modal-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header-user__name {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px;
}
</style>
