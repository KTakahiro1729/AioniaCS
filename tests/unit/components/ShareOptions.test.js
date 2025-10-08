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

  test('shows sign-in prompt when user is not signed in', () => {
    const wrapper = mount(ShareOptions, {
      props: { shareLink: '', isGenerating: false },
    });
    expect(wrapper.text()).toContain('共有リンクを作成するには');
    wrapper.find('button').trigger('click');
    expect(wrapper.emitted('signin')).toHaveLength(1);
  });

  test('emits share and copy events when signed in', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const wrapper = mount(ShareOptions, {
      props: { shareLink: '', isGenerating: false },
    });

    await wrapper.find('.button-base--primary').trigger('click');
    expect(wrapper.emitted('share')).toHaveLength(1);

    const copyButton = wrapper.find('.share-modal__actions button:last-child');
    expect(copyButton.attributes('disabled')).toBeDefined();
    await wrapper.setProps({ shareLink: 'https://example.com' });
    await copyButton.trigger('click');
    expect(wrapper.emitted('copy')).toHaveLength(1);
    expect(wrapper.emitted('copy')[0]).toEqual(['https://example.com']);
  });
});
