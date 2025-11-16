import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MainHeader from '@/features/character-sheet/components/ui/MainHeader.vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

describe('MainHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('shows character name when provided', async () => {
    const wrapper = mount(MainHeader, {
      props: {
        defaultTitle: 'Default',
        helpLabel: '?',
        helpState: 'closed',
        newCharacterLabel: 'new',
        signInLabel: 'sign in',
        signOutLabel: 'sign out',
      },
    });
    const charStore = useCharacterStore();
    charStore.character.name = 'Hero';
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.main-header__title').text()).toBe('Hero');
  });

  test('emits new character and sign events', async () => {
    const wrapper = mount(MainHeader, {
      props: {
        defaultTitle: 'Default',
        helpLabel: '?',
        helpState: 'closed',
        newCharacterLabel: 'new',
        signInLabel: 'sign in',
        signOutLabel: 'sign out',
      },
    });
    await wrapper.find('.main-header__section--left .main-header__button').trigger('click');
    expect(wrapper.emitted('new-character')).toHaveLength(1);
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    await wrapper.vm.$nextTick();
    await wrapper.find('.main-header__section--right .main-header__button').trigger('click');
    expect(wrapper.emitted('sign-in')).toHaveLength(1);
    uiStore.isSignedIn = true;
    await wrapper.vm.$nextTick();
    await wrapper.find('.main-header__section--right .main-header__button').trigger('click');
    expect(wrapper.emitted('sign-out')).toHaveLength(1);
  });
});
