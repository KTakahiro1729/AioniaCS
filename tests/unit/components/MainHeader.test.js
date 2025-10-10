import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MainHeader from '@/features/character-sheet/components/ui/MainHeader.vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

const isAuthenticated = Vue.ref(false);
const user = Vue.ref(null);

vi.mock('@auth0/auth0-vue', () => ({
  useAuth0: () => ({
    isAuthenticated,
    user,
  }),
}));

describe('MainHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isAuthenticated.value = false;
    user.value = null;
  });

  test('shows character name when provided', async () => {
    const wrapper = mount(MainHeader, {
      props: {
        defaultTitle: 'Default',
        cloudHubLabel: 'hub',
        helpLabel: '?',
        helpState: 'closed',
      },
    });
    const charStore = useCharacterStore();
    charStore.character.name = 'Hero';
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.main-header__title').text()).toBe('Hero');
  });

  test('cloud hub hidden when not signed in', async () => {
    const wrapper = mount(MainHeader, {
      props: {
        defaultTitle: 'Default',
        cloudHubLabel: 'hub',
        helpLabel: '?',
        helpState: 'closed',
      },
    });
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.icon-button').exists()).toBe(true);
  });

  test('renders Auth0 user name when available', async () => {
    isAuthenticated.value = true;
    user.value = { name: 'Auth0 Tester' };

    const wrapper = mount(MainHeader, {
      props: {
        defaultTitle: 'Default',
        cloudHubLabel: 'hub',
        helpLabel: '?',
        helpState: 'closed',
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find('.main-header__user').text()).toBe('Auth0 Tester');
  });
});
