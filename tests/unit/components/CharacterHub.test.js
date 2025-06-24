import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import CharacterHub from '../../../src/components/ui/CharacterHub.vue';
import { useUiStore } from '../../../src/stores/uiStore.js';

vi.mock('../../../src/composables/useModal.js', () => ({
  useModal: () => ({ showModal: vi.fn().mockResolvedValue({ value: 'delete' }) }),
}));
vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: vi.fn(), showAsyncToast: vi.fn() }),
}));

describe('CharacterHub', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('delete button calls dataManager.deleteCharacter', async () => {
    const dm = { deleteCharacter: vi.fn().mockResolvedValue(), loadDataFromDrive: vi.fn(), saveData: vi.fn() };
    const wrapper = mount(CharacterHub, {
      props: { dataManager: dm, loadCharacter: vi.fn(), saveToDrive: vi.fn() },
    });
    const store = useUiStore();
    store.isSignedIn = true;
    store.driveCharacters = [{ fileId: '1', characterName: 'A', updatedAt: 't' }];
    await wrapper.vm.$nextTick();
    const btn = wrapper.findAll('.button-base.button-compact')[2];
    await btn.trigger('click');
    await Vue.nextTick();
    expect(dm.deleteCharacter).toHaveBeenCalledWith('1');
  });

  test('renders character list', async () => {
    const wrapper = mount(CharacterHub, {
      props: { dataManager: {}, loadCharacter: vi.fn(), saveToDrive: vi.fn() },
    });
    const store = useUiStore();
    store.isSignedIn = true;
    store.driveCharacters = [{ fileId: '1', characterName: 'A', updatedAt: 't' }];
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('A');
  });
});
