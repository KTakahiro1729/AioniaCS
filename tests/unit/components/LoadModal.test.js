import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import LoadModal from '@/features/modals/components/contents/LoadModal.vue';

function baseProps(overrides = {}) {
  return {
    isSignedIn: false,
    canSignIn: true,
    isDriveReady: true,
    loadLocalLabel: 'local',
    restoreHistoryLabel: 'history',
    hasHistory: false,
    signInLabel: 'signin',
    signInMessage: 'message',
    loadCharacterFromDrive: vi.fn(),
    ...overrides,
  };
}

function mountWithStubs(props) {
  return mount(LoadModal, {
    props,
    global: {
      stubs: {
        DriveLoadContent: { template: '<div data-test="drive-load-content-stub" />' },
      },
    },
  });
}

describe('LoadModal', () => {
  test('emits load-local on file change', async () => {
    const wrapper = mountWithStubs(baseProps());
    const input = wrapper.find('input[type="file"]');
    await input.trigger('change');
    expect(wrapper.emitted('load-local')).toBeTruthy();
  });

  test('shows sign-in button when signed out', async () => {
    const wrapper = mountWithStubs(baseProps({ isSignedIn: false }));
    const button = wrapper.find('[data-test="load-modal-signin"]');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    expect(wrapper.emitted('sign-in')).toHaveLength(1);
  });

  test('hides drive content when signed out', async () => {
    const wrapper = mountWithStubs(baseProps({ isSignedIn: false }));
    expect(wrapper.find('[data-test="drive-load-content-stub"]').exists()).toBe(false);
  });

  test('shows drive content when signed in', async () => {
    const wrapper = mountWithStubs(baseProps({ isSignedIn: true }));
    expect(wrapper.find('[data-test="drive-load-content-stub"]').exists()).toBe(true);
  });

  test('shows disabled history button when no history exists', async () => {
    const wrapper = mount(LoadModal, { props: baseProps({ hasHistory: false }) });
    const historyButton = wrapper.find('[data-test="load-modal-history-button"]');
    expect(historyButton.exists()).toBe(true);
    expect(historyButton.attributes('disabled')).toBeDefined();
  });

  test('shows enabled history button when history exists', async () => {
    const wrapper = mount(LoadModal, { props: baseProps({ hasHistory: true }) });
    const historyButton = wrapper.find('[data-test="load-modal-history-button"]');
    expect(historyButton.exists()).toBe(true);
    expect(historyButton.attributes('disabled')).toBeUndefined();
    await historyButton.trigger('click');
    expect(wrapper.emitted('open-history')).toHaveLength(1);
  });
});
