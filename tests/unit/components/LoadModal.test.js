import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import LoadModal from '@/features/modals/components/contents/LoadModal.vue';

function baseProps(overrides = {}) {
  return {
    isSignedIn: false,
    canSignIn: true,
    isDriveReady: true,
    driveFolderPath: 'path',
    driveFolderLabel: 'label',
    driveFolderPlaceholder: 'placeholder',
    changeFolderLabel: 'change',
    loadLocalLabel: 'local',
    loadDriveLabel: 'drive',
    restoreHistoryLabel: 'history',
    hasHistory: false,
    signInLabel: 'signin',
    signInMessage: 'message',
    ...overrides,
  };
}

describe('LoadModal', () => {
  test('emits load-local on file change', async () => {
    const wrapper = mount(LoadModal, { props: baseProps() });
    const input = wrapper.find('input[type="file"]');
    await input.trigger('change');
    expect(wrapper.emitted('load-local')).toBeTruthy();
  });

  test('shows sign-in button when signed out', async () => {
    const wrapper = mount(LoadModal, { props: baseProps({ isSignedIn: false }) });
    const button = wrapper.find('[data-test="load-modal-signin"]');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    expect(wrapper.emitted('sign-in')).toHaveLength(1);
  });

  test('disables drive controls when signed out', async () => {
    const wrapper = mount(LoadModal, { props: baseProps({ isSignedIn: false }) });
    expect(wrapper.find('.load-modal__input').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-test="load-modal-drive-button"]').exists()).toBe(false);
  });

  test('shows history button when history exists', async () => {
    const wrapper = mount(LoadModal, { props: baseProps({ hasHistory: true }) });
    const historyButton = wrapper.find('[data-test="load-modal-history-button"]');
    expect(historyButton.exists()).toBe(true);
    await historyButton.trigger('click');
    expect(wrapper.emitted('open-history')).toHaveLength(1);
  });
});
