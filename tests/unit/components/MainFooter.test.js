import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MainFooter from '@/features/character-sheet/components/ui/MainFooter.vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

describe('MainFooter', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function mountFooter(overrides = {}) {
    return mount(MainFooter, {
      props: {
        experienceStatusClass: '',
        currentExperiencePoints: 1,
        maxExperiencePoints: 2,
        experienceLabel: 'EXP',
        isViewingShared: false,
        saveToDrive: vi.fn(),
        outputLabel: 'output',
        shareLabel: 'share',
        copyEditLabel: 'copy',
        loadLabel: 'load',
        saveLabel: 'save',
        ...overrides,
      },
    });
  }

  test('disables save button when signed out', async () => {
    const wrapper = mountFooter();
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    await wrapper.vm.$nextTick();
    const saveButton = wrapper.find('.footer-button--save');
    expect(saveButton.attributes('disabled')).toBeDefined();
    await saveButton.trigger('click');
    expect(wrapper.props('saveToDrive')).not.toHaveBeenCalled();
    await wrapper.find('.footer-button--load').trigger('click');
    expect(wrapper.emitted('open-load-modal')).toBeTruthy();
  });

  test('drive actions when signed in', async () => {
    const saveDrive = vi.fn();
    const wrapper = mountFooter({ saveToDrive: saveDrive });
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    await wrapper.vm.$nextTick();
    await wrapper.find('.footer-button--save').trigger('click');
    expect(saveDrive).toHaveBeenCalled();
    await wrapper.find('.footer-button--output').trigger('click');
    expect(wrapper.emitted('open-output-modal')).toBeTruthy();
    await wrapper.find('.footer-button--share').trigger('click');
    expect(wrapper.emitted('share')).toBeTruthy();
  });
});
