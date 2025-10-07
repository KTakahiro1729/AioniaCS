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

  test('emits canGenerate updates based on sign-in state', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    const wrapper = mount(ShareOptions, {
      props: { longData: false },
    });

    let events = wrapper.emitted('update:canGenerate');
    expect(events[events.length - 1][0]).toBe(false);

    uiStore.isSignedIn = true;
    await nextTick();
    events = wrapper.emitted('update:canGenerate');
    expect(events[events.length - 1][0]).toBe(true);
  });

  test('emits signin event when button clicked', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    const wrapper = mount(ShareOptions, {
      props: { longData: false },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('signin')).toBeTruthy();
  });

  test('shows long data note when longData is true', () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const wrapper = mount(ShareOptions, {
      props: { longData: true },
    });
    const notes = wrapper.findAll('.share-options__note');
    expect(notes.some((node) => node.text().includes('画像やメモ'))).toBe(true);
  });
});
