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
      return new Promise((resolve, reject) => {
        this.isVisible = true;
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
      });
    },
    hideModal() {
      this.isVisible = false;
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
