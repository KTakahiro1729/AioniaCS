import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ShareOptions from '../../../src/components/modals/contents/ShareOptions.vue';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('ShareOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('shows sign-in prompt when signed out', () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    const wrapper = mount(ShareOptions, {
      props: { shareLink: '', isGenerating: false },
    });
    expect(wrapper.find('.share-options__signin').exists()).toBe(true);
    expect(wrapper.find('.share-options__generate').attributes('disabled')).toBeDefined();
  });

  test('emits share event when generate button clicked', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const wrapper = mount(ShareOptions, {
      props: { shareLink: '', isGenerating: false },
    });
    await wrapper.find('.share-options__generate').trigger('click');
    expect(wrapper.emitted('share')).toBeTruthy();
  });

  test('copy button disabled without link and emits copy when link present', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const wrapper = mount(ShareOptions, {
      props: { shareLink: '', isGenerating: false },
    });
    const copyButton = wrapper.find('.share-options__copy');
    expect(copyButton.attributes('disabled')).toBeDefined();

    await wrapper.setProps({ shareLink: 'https://example.com' });
    expect(wrapper.find('input').element.value).toBe('https://example.com');
    expect(copyButton.attributes('disabled')).toBeUndefined();
    await copyButton.trigger('click');
    expect(wrapper.emitted('copy')).toBeTruthy();
  });
});
