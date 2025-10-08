import * as Vue from 'vue';
global.Vue = Vue;
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ShareOptions from '@/features/modals/components/contents/ShareOptions.vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

const mockCreateShareLink = vi.fn();
const mockCopyLink = vi.fn();

vi.mock('@/features/cloud-sync/composables/useShare.js', () => ({
  useShare: () => ({
    createShareLink: mockCreateShareLink,
    copyLink: mockCopyLink,
  }),
}));

describe('ShareOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockCreateShareLink.mockReset();
    mockCopyLink.mockReset();
  });

  test('renders sign-in prompt when user is not signed in', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;

    const wrapper = mount(ShareOptions, {
      props: { dataManager: {} },
    });

    expect(wrapper.text()).toContain('共有リンクを作成するには Google Drive にサインインしてください。');
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('signin')).toBeTruthy();
  });

  test('displays generated link and copies it', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    mockCreateShareLink.mockResolvedValueOnce('https://example.com/share');

    const wrapper = mount(ShareOptions, {
      props: { dataManager: {} },
    });

    await flushPromises();
    const input = wrapper.find('input.share-modal__input');
    expect(input.element.value).toBe('https://example.com/share');

    await wrapper.find('button.share-modal__copy').trigger('click');
    expect(mockCopyLink).toHaveBeenCalledWith('https://example.com/share');
  });

  test('shows error and retries generation', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    mockCreateShareLink.mockRejectedValueOnce(new Error('temp error')).mockResolvedValueOnce('https://retry-link');

    const wrapper = mount(ShareOptions, {
      props: { dataManager: {} },
    });

    await flushPromises();
    expect(wrapper.text()).toContain('temp error');

    await wrapper.find('button.share-modal__retry').trigger('click');
    await flushPromises();

    expect(wrapper.find('input.share-modal__input').element.value).toBe('https://retry-link');
    expect(mockCreateShareLink).toHaveBeenCalledTimes(2);
  });
});
