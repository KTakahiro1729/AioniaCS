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

  test('local save and file upload when signed out', async () => {
    const saveLocal = vi.fn();
    const wrapper = mount(MainFooter, {
      props: {
        experienceStatusClass: '',
        currentExperiencePoints: 1,
        maxExperiencePoints: 2,
        experienceLabel: 'EXP',
        isViewingShared: false,
        saveLocal,
        saveToDrive: vi.fn(),
        outputLabel: 'output',
        shareLabel: 'share',
        copyEditLabel: 'copy',
      },
    });
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    await wrapper.find('.footer-button--save').trigger('click');
    expect(saveLocal).toHaveBeenCalled();
    await wrapper.find('.footer-button--load').trigger('click');
    expect(wrapper.emitted('open-load-modal')).toBeTruthy();
    expect(wrapper.find('.footer-button--share').attributes('disabled')).toBeDefined();
  });

  test('drive actions when signed in', async () => {
    const saveDrive = vi.fn();
    const wrapper = mount(MainFooter, {
      props: {
        experienceStatusClass: '',
        currentExperiencePoints: 1,
        maxExperiencePoints: 2,
        experienceLabel: 'EXP',
        isViewingShared: false,
        saveLocal: vi.fn(),
        saveToDrive: saveDrive,
        outputLabel: 'output',
        shareLabel: 'share',
        copyEditLabel: 'copy',
      },
    });
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.currentDriveFileId = null;
    await wrapper.find('.footer-button--save').trigger('click');
    expect(saveDrive).toHaveBeenCalled();
    await wrapper.find('.footer-button--output').trigger('click');
    expect(wrapper.emitted('open-output-modal')).toBeTruthy();
    uiStore.currentDriveFileId = 'id';
    await wrapper.find('.footer-button--save').trigger('click');
    expect(saveDrive).toHaveBeenCalledTimes(2);
    await wrapper.find('.footer-button--share').trigger('click');
    expect(wrapper.emitted('share')).toBeTruthy();
  });
});
