import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

export const useModalStore = defineStore('modal', {
  state: () => ({
    isVisible: false,
    title: '',
    message: '',
    type: '',
    component: shallowRef(null),
    props: {},
    buttons: [],
    events: {},
    size: 'default',
    resolvePromise: null,
    rejectPromise: null,
  }),
  actions: {
    showModal(options) {
      // Reject any pending promise so callers don't hang indefinitely
      if (this.rejectPromise) {
        this.rejectPromise(new Error('Modal was dismissed by opening another modal.'));
      }
      // Reset any leftover state from a previous modal before setting new state
      this._resetState();
      return new Promise((resolve, reject) => {
        this.title = options.title || '';
        this.message = options.message || '';
        this.type = options.type || '';
        this.component = options.component || null;
        this.props = options.props || {};
        this.buttons = options.buttons || [];
        this.events = options.on || {};
        this.size = options.size || 'default';
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
        // Set isVisible last so all data is ready before render
        this.isVisible = true;
      });
    },
    hideModal() {
      // Only toggle visibility; state is preserved for the leave transition.
      // BaseModal calls _resetState() via @after-leave once the transition ends.
      this.isVisible = false;
    },
    _resetState() {
      this.title = '';
      this.message = '';
      this.type = '';
      this.component = null;
      this.props = {};
      this.buttons = [];
      this.events = {};
      this.size = 'default';
      this.resolvePromise = null;
      this.rejectPromise = null;
    },
    resolveModal(value) {
      if (this.resolvePromise) {
        this.resolvePromise(value);
      }
      this.hideModal();
    },
    openHistoryRecoveryModal(options) {
      return this.showModal({ type: 'history-recovery', ...options });
    },
  },
});
