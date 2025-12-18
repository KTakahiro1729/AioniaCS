import { vi } from 'vitest';
import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import LoadModal from '@/features/modals/components/contents/LoadModal.vue';
import { useModalStore } from '@/features/modals/stores/modalStore.js';

const showToastMock = vi.fn();
vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: showToastMock }),
}));

function baseProps(overrides = {}) {
  return {
    isSignedIn: false,
    canSignIn: true,
    isDriveReady: true,
    isDriveTokenWarm: true,
    isDriveActionLoading: false,
    driveFolderPath: 'path',
    driveFolderLabel: 'label',
    driveFolderPlaceholder: 'placeholder',
    changeFolderLabel: 'change',
    loadLocalLabel: 'local',
    loadDriveLabel: 'drive',
    signInLabel: 'signin',
    signInMessage: 'message',
    ...overrides,
  };
}

describe('LoadModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    showToastMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('emits load-local on file change', async () => {
    const wrapper = mount(LoadModal, { props: baseProps(), global: { plugins: [createPinia()] } });
    const input = wrapper.find('input[type="file"]');
    await input.trigger('change');
    expect(wrapper.emitted('load-local')).toBeTruthy();
  });

  test('shows sign-in button when signed out', async () => {
    const wrapper = mount(LoadModal, { props: baseProps({ isSignedIn: false }), global: { plugins: [createPinia()] } });
    const button = wrapper.find('[data-test="load-modal-signin"]');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    expect(wrapper.emitted('sign-in')).toHaveLength(1);
  });

  test('disables drive controls when signed out', async () => {
    const wrapper = mount(LoadModal, { props: baseProps({ isSignedIn: false }), global: { plugins: [createPinia()] } });
    expect(wrapper.find('.load-modal__input').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-test="load-modal-drive-button"]').exists()).toBe(false);
  });

  test('auto closes after 40 minutes and shows warning toast', async () => {
    const wrapper = mount(LoadModal, { props: baseProps(), global: { plugins: [createPinia()] } });
    const modalStore = useModalStore();
    modalStore.showModal({});

    vi.advanceTimersByTime(40 * 60 * 1000);
    await Vue.nextTick();

    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: '長時間読込ウィンドウが開かれていたため、自動で閉じました' }),
    );
    expect(modalStore.isVisible).toBe(false);
    wrapper.unmount();
  });

  test('clears timeout when unmounted early', async () => {
    const wrapper = mount(LoadModal, { props: baseProps(), global: { plugins: [createPinia()] } });
    wrapper.unmount();
    vi.advanceTimersByTime(40 * 60 * 1000);
    expect(showToastMock).not.toHaveBeenCalled();
  });
});
