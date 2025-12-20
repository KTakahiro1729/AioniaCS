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
    driveFolderChangeLabel: 'change',
    driveFolderPlaceholder: 'placeholder',
    loadLocalLabel: 'local',
    selectCharacterLabel: 'Driveから読み込む',
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
    expect(wrapper.find('[data-test="load-modal-apply-folder"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-test="load-modal-select-character"]').exists()).toBe(false);
  });

  test('shows drive load label and emits select-character when signed in', async () => {
    const wrapper = mount(LoadModal, { props: baseProps({ isSignedIn: true }) });
    const button = wrapper.find('[data-test="load-modal-select-character"]');
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe('Driveから読み込む');
    await button.trigger('click');
    expect(wrapper.emitted('select-character')).toHaveLength(1);
  });

  test('emits update-drive-folder-path when apply is clicked while signed in', async () => {
    const wrapper = mount(LoadModal, { props: baseProps({ isSignedIn: true }) });
    const applyButton = wrapper.find('[data-test="load-modal-apply-folder"]');
    await applyButton.trigger('click');
    expect(wrapper.emitted('update-drive-folder-path')).toHaveLength(1);
  });
});
