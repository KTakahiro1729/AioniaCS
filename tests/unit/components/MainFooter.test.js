import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MainFooter from '../../../src/components/ui/MainFooter.vue';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('MainFooter', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('local save and file upload when signed out', async () => {
    const saveLocal = vi.fn();
    const fileUpload = vi.fn();
    const wrapper = mount(MainFooter, {
      props: {
        experienceStatusClass: '',
        currentExperiencePoints: 1,
        maxExperiencePoints: 2,
        experienceLabel: 'EXP',
        isViewingShared: false,
        saveLocal,
        handleFileUpload: fileUpload,
        openHub: vi.fn(),
        saveToCloud: vi.fn(),
        ioLabel: 'io',
        shareLabel: 'share',
        copyEditLabel: 'copy',
      },
    });
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    await wrapper.find('.footer-button--save').trigger('click');
    expect(saveLocal).toHaveBeenCalled();
    await wrapper.find('#load_input_vue').trigger('change');
    expect(fileUpload).toHaveBeenCalled();
  });

  test('cloud actions when signed in', async () => {
    const saveCloud = vi.fn();
    const openHub = vi.fn();
    const wrapper = mount(MainFooter, {
      props: {
        experienceStatusClass: '',
        currentExperiencePoints: 1,
        maxExperiencePoints: 2,
        experienceLabel: 'EXP',
        isViewingShared: false,
        saveLocal: vi.fn(),
        handleFileUpload: vi.fn(),
        openHub,
        saveToCloud: saveCloud,
        ioLabel: 'io',
        shareLabel: 'share',
        copyEditLabel: 'copy',
      },
    });
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.currentCloudFileId = null;
    await wrapper.find('.footer-button--save').trigger('click');
    expect(saveCloud).toHaveBeenCalled();
    await wrapper.find('.footer-button--load').trigger('click');
    expect(openHub).toHaveBeenCalled();
    uiStore.currentCloudFileId = 'id';
    await wrapper.find('.footer-button--save').trigger('click');
    expect(saveCloud).toHaveBeenCalledTimes(2);
  });
});
