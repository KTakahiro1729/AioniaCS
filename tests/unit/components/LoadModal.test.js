import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';
import { vi } from 'vitest';
import LoadModal from '@/features/modals/components/contents/LoadModal.vue';

const findFolderMock = vi.fn();
const createFolderMock = vi.fn();

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
    createFolder: (...args) => createFolderMock(...args),
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
    createFolderMock.mockReset();
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
    await wrapper.find('[data-test="load-modal-apply-folder"]').trigger('click');
    await flushPromises();
    expect(wrapper.emitted('update-drive-folder-path')).toHaveLength(1);
    expect(createFolderMock).not.toHaveBeenCalled();
  });

  test('creates missing drive folders after yes and then emits update event', async () => {
    findFolderMock.mockResolvedValue(null);
    createFolderMock.mockResolvedValueOnce({ id: 'folder-parent' }).mockResolvedValueOnce({ id: 'folder-child' });

    const wrapper = mountWithStubs(baseProps({ isSignedIn: true, driveFolderPath: 'missing/folder' }));
    await wrapper.find('[data-test="load-modal-folder-toggle"]').trigger('click');
    await wrapper.find('[data-test="load-modal-apply-folder"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('confirm create?');
    expect(wrapper.find('[data-test="load-modal-apply-folder"]').attributes('disabled')).toBeDefined();

    await wrapper.find('[data-test="load-modal-folder-create-yes"]').trigger('click');
    await flushPromises();

    expect(createFolderMock).toHaveBeenCalledTimes(2);
    expect(createFolderMock).toHaveBeenNthCalledWith(1, 'missing', 'root');
    expect(createFolderMock).toHaveBeenNthCalledWith(2, 'folder', 'folder-parent');
    expect(wrapper.emitted('update-drive-folder-path')).toHaveLength(1);
  });

  test('treats empty folder path as root and applies without create prompt', async () => {
    const wrapper = mountWithStubs(baseProps({ isSignedIn: true, driveFolderPath: '' }));
    await wrapper.find('[data-test="load-modal-folder-toggle"]').trigger('click');
    await wrapper.find('[data-test="load-modal-apply-folder"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-test="load-modal-folder-create-yes"]').exists()).toBe(false);
    expect(createFolderMock).not.toHaveBeenCalled();
    expect(wrapper.emitted('update-drive-folder-path')).toHaveLength(1);
    expect(wrapper.emitted('update-drive-folder-path')[0]).toEqual(['']);
  });

  test('disables folder input while create confirmation is visible', async () => {
    findFolderMock.mockResolvedValue(null);
    const wrapper = mountWithStubs(baseProps({ isSignedIn: true, driveFolderPath: 'missing/folder' }));
    await wrapper.find('[data-test="load-modal-folder-toggle"]').trigger('click');
    await wrapper.find('[data-test="load-modal-apply-folder"]').trigger('click');
    await flushPromises();

    const input = wrapper.find('#load_modal_drive_folder');
    expect(input.attributes('disabled')).toBeDefined();
  });

  test('reverts input and does not emit update when validation throws', async () => {
    findFolderMock.mockRejectedValue(new Error('network'));
    const wrapper = mountWithStubs(baseProps({ isSignedIn: true, driveFolderPath: 'saved/path' }));
    await wrapper.find('[data-test="load-modal-folder-toggle"]').trigger('click');

    const input = wrapper.find('#load_modal_drive_folder');
    await input.setValue('broken/path');
    await wrapper.find('[data-test="load-modal-apply-folder"]').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('update-drive-folder-path')).toBeFalsy();
    expect(input.element.value).toBe('saved/path');
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
