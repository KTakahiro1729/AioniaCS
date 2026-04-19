import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import CharacterMemoSection from '@/features/character-sheet/components/sections/CharacterMemoSection.vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';

const mockShowModal = vi.fn();
vi.mock('@/features/modals/composables/useModal.js', () => ({
  useModal: () => ({ showModal: mockShowModal }),
}));

describe('CharacterMemoSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockShowModal.mockReset();
    localStorage.clear();
  });

  test('adds sub memos and toggles visibility', async () => {
    const wrapper = mount(CharacterMemoSection);
    await wrapper.find('.add-button-row .list-button--add').trigger('click');
    await wrapper.vm.$nextTick();
    const toggle = wrapper.find('.submemo-toggle');
    expect(wrapper.findAllComponents({ name: 'SubMemoItem' }).length || wrapper.findAll('.submemo-item').length).toBe(1);
    expect(wrapper.find('.submemo-body').element.style.display).toBe('none');
    await toggle.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.submemo-body').element.style.display).not.toBe('none');
  });

  test('confirms before deleting sub memo', async () => {
    const store = useCharacterStore();
    store.addSubMemo({ title: 'Temp' });
    mockShowModal.mockResolvedValue({ value: 'delete' });
    const wrapper = mount(CharacterMemoSection);
    await wrapper.find('.list-button--delete').trigger('click');
    await wrapper.vm.$nextTick();
    expect(store.character.subMemos).toHaveLength(0);
  });
});
