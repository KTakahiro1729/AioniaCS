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
    driveFolderPath: 'path',
    driveFolderLabel: 'label',
    driveFolderChangeLabel: 'change',
    driveFolderPlaceholder: 'placeholder',
    loadLocalLabel: 'local',
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

  test('disables drive controls when signed out', async () => {
    const wrapper = mountWithStubs(baseProps({ isSignedIn: false }));
    expect(wrapper.find('.load-modal__input').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-test="load-modal-apply-folder"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-test="drive-load-content-stub"]').exists()).toBe(false);
  });

  test('shows drive content when signed in', async () => {
    const wrapper = mountWithStubs(baseProps({ isSignedIn: true }));
    expect(wrapper.find('[data-test="drive-load-content-stub"]').exists()).toBe(true);
  });

  test('emits update-drive-folder-path when apply is clicked while signed in', async () => {
    const wrapper = mountWithStubs(baseProps({ isSignedIn: true }));
    const applyButton = wrapper.find('[data-test="load-modal-apply-folder"]');
    await applyButton.trigger('click');
    expect(wrapper.emitted('update-drive-folder-path')).toHaveLength(1);
  });
});
