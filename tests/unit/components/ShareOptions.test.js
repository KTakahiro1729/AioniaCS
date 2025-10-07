import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import ShareOptions from '../../../src/components/modals/contents/ShareOptions.vue';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('ShareOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('emits canGenerate updates', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    const wrapper = mount(ShareOptions, {});

    let events = wrapper.emitted('update:canGenerate');
    expect(events[events.length - 1][0]).toBe(false);

    uiStore.isSignedIn = true;
    await nextTick();
    events = wrapper.emitted('update:canGenerate');
    expect(events[events.length - 1][0]).toBe(true);
  });

  test('sign-in button toggles with authentication state and password input toggles', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    const wrapper = mount(ShareOptions);

    expect(wrapper.find('.share-options__signin').exists()).toBe(true);

    uiStore.isSignedIn = true;
    await nextTick();
    expect(wrapper.find('.share-options__signin').exists()).toBe(false);

    await wrapper.find('input[type="checkbox"]').setChecked();
    await nextTick();
    expect(wrapper.find('input.share-options__password-input').exists()).toBe(true);
  });
});
