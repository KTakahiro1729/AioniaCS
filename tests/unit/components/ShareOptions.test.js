import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import ShareOptions from '../../../src/components/modals/contents/ShareOptions.vue';

describe('ShareOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('emits canGenerate updates', async () => {
    const wrapper = mount(ShareOptions, {
      props: { signedIn: false, longData: false },
    });

    await wrapper.find('input[value="dynamic"]').setValue();
    await nextTick();
    let events = wrapper.emitted('update:canGenerate');
    expect(events[events.length - 1][0]).toBe(false);

    await wrapper.setProps({ signedIn: true });
    await nextTick();
    events = wrapper.emitted('update:canGenerate');
    expect(events[events.length - 1][0]).toBe(true);
  });

  test('truncate warning shown only when full content disabled', async () => {
    const wrapper = mount(ShareOptions, {
      props: { signedIn: true, longData: true },
    });
    expect(wrapper.find('.share-options__warning').exists()).toBe(true);

    await wrapper.find('input[type="checkbox"]').setChecked();
    await nextTick();
    expect(wrapper.find('.share-options__warning').exists()).toBe(false);
  });
});
