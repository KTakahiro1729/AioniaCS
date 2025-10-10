import * as Vue from 'vue';
global.Vue = Vue;
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ShareOptions from '@/features/modals/components/contents/ShareOptions.vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

const mockCreateShareLink = vi.fn();
const mockCopyLink = vi.fn();
const isAuthenticated = Vue.ref(false);
const isLoading = Vue.ref(false);
const loginWithRedirect = vi.fn();

vi.mock('@/features/cloud-sync/composables/useShare.js', () => ({
  useShare: () => ({
    createShareLink: mockCreateShareLink,
    copyLink: mockCopyLink,
  }),
}));

vi.mock('@auth0/auth0-vue', () => ({
  useAuth0: () => ({
    isAuthenticated,
    isLoading,
    loginWithRedirect,
  }),
}));

describe('ShareOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockCreateShareLink.mockReset();
    mockCopyLink.mockReset();
    isAuthenticated.value = false;
    isLoading.value = false;
    loginWithRedirect.mockReset();
  });

  test('renders sign-in prompt when user is not signed in', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    isAuthenticated.value = false;

    const wrapper = mount(ShareOptions, {
      props: { dataManager: {} },
    });

    expect(wrapper.text()).toContain('共有リンクを作成するには Google Drive にサインインしてください。');
    await wrapper.find('button').trigger('click');
    expect(loginWithRedirect).toHaveBeenCalledTimes(1);
  });

  test('displays generated link and copies it', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    mockCreateShareLink.mockResolvedValue('https://example.com/share');

    const wrapper = mount(ShareOptions, {
      props: { dataManager: {} },
    });

    isAuthenticated.value = true;
    await flushPromises();
    await flushPromises();
    expect(mockCreateShareLink).toHaveBeenCalled();
    const input = wrapper.find('input.share-modal__input');
    expect(input.element.value).toBe('https://example.com/share');

    await wrapper.find('button.share-modal__copy').trigger('click');
    expect(mockCopyLink).toHaveBeenCalledWith('https://example.com/share');
  });

  test('shows error and retries generation', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    mockCreateShareLink.mockImplementation(() => Promise.reject(new Error('temp error')));

    const wrapper = mount(ShareOptions, {
      props: { dataManager: {} },
    });

    isAuthenticated.value = true;
    await flushPromises();
    await flushPromises();
    expect(mockCreateShareLink).toHaveBeenCalled();
    expect(wrapper.text()).toContain('temp error');

    mockCreateShareLink.mockImplementation(() => Promise.resolve('https://retry-link'));

    await wrapper.find('button.share-modal__retry').trigger('click');
    await flushPromises();
    await flushPromises();

    expect(wrapper.find('input.share-modal__input').element.value).toBe('https://retry-link');
    expect(mockCreateShareLink.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
