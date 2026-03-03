import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';
import { vi } from 'vitest';
import LoadModal from '@/features/modals/components/contents/LoadModal.vue';

const findFolderMock = vi.fn();

vi.mock('@/infrastructure/google-drive/index.js', () => ({
  getDriveManagerInstance: () => ({
    normalizeFolderPath: (path) =>
      String(path || '')
        .replace(/\\/g, '/')
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean)
        .join('/'),
    findFolder: (...args) => findFolderMock(...args),
  }),
}));

function baseProps(overrides = {}) {
  return {
    isSignedIn: false,
    canSignIn: true,
    isDriveReady: true,
    driveFolderPath: 'path',
    driveFolderLabel: 'label',
    driveFolderChangeLabel: 'confirm',
    driveFolderPlaceholder: 'placeholder',
    driveFolderCreateConfirmMessage: 'confirm create?',
    driveFolderCreateYesLabel: 'yes',
    driveFolderCreateNoLabel: 'no',
    loadLocalLabel: 'local',
    loadDriveLabel: 'drive',
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
  beforeEach(() => {
    findFolderMock.mockReset();
  });

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

  test('hides drive controls when signed out', async () => {
    const wrapper = mountWithStubs(baseProps({ isSignedIn: false }));
    expect(wrapper.find('.load-modal__folder').exists()).toBe(false);
    expect(wrapper.find('.load-modal__input').exists()).toBe(false);
    expect(wrapper.find('[data-test="load-modal-apply-folder"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="drive-load-content-stub"]').exists()).toBe(false);
  });

  test('shows drive content when signed in', async () => {
    const wrapper = mountWithStubs(baseProps({ isSignedIn: true }));
    expect(wrapper.find('[data-test="drive-load-content-stub"]').exists()).toBe(true);
  });

  test('emits update-drive-folder-path when apply is clicked with existing folder path', async () => {
    findFolderMock.mockResolvedValue({ id: 'folder-1' });
    const wrapper = mountWithStubs(baseProps({ isSignedIn: true }));
    await wrapper.find('[data-test="load-modal-folder-toggle"]').trigger('click');
    const applyButton = wrapper.find('[data-test="load-modal-apply-folder"]');
    await applyButton.trigger('click');
    await flushPromises();
    expect(wrapper.emitted('update-drive-folder-path')).toHaveLength(1);
  });

  test('shows create prompt when folder does not exist and emits after yes', async () => {
    findFolderMock.mockResolvedValue(null);
    const wrapper = mountWithStubs(baseProps({ isSignedIn: true, driveFolderPath: 'missing/folder' }));
    await wrapper.find('[data-test="load-modal-folder-toggle"]').trigger('click');
    await wrapper.find('[data-test="load-modal-apply-folder"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('confirm create?');
    expect(wrapper.find('[data-test="load-modal-apply-folder"]').attributes('disabled')).toBeDefined();

    await wrapper.find('[data-test="load-modal-folder-create-yes"]').trigger('click');
    expect(wrapper.emitted('update-drive-folder-path')).toHaveLength(1);
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
