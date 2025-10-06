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
    const wrapper = mount(ShareOptions, {
      props: { longData: false },
    });

    await wrapper.find('input[value="dynamic"]').setValue();
    await nextTick();
    let events = wrapper.emitted('update:canGenerate');
    expect(events[events.length - 1][0]).toBe(false);

    uiStore.isSignedIn = true;
    await nextTick();
    events = wrapper.emitted('update:canGenerate');
    expect(events[events.length - 1][0]).toBe(true);
  });

  test('truncate warning shown only when full content disabled', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const wrapper = mount(ShareOptions, {
      props: { longData: true },
    });
    expect(wrapper.find('.share-options__warning').exists()).toBe(true);

    await wrapper.find('input[type="checkbox"]').setChecked();
    await nextTick();
    expect(wrapper.find('.share-options__warning').exists()).toBe(false);
  });
});
