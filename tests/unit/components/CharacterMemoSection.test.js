import * as Vue from 'vue';
global.Vue = Vue;
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import CharacterMemoSection from '@/features/character-sheet/components/sections/CharacterMemoSection.vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

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

  test('shows spoiler guard until revealed', async () => {
    const store = useCharacterStore();
    const uiStore = useUiStore();
    uiStore.isViewingShared = true;
    const memo = store.addSubMemo({ isSpoiler: true, content: 'Secret' });
    const wrapper = mount(CharacterMemoSection);
    const toggle = wrapper.find('.submemo-toggle');
    await toggle.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('※秘密メモです');
    await wrapper.find('.submemo-guard .button-base').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.submemo-textarea').element.value).toBe('Secret');
    const saved = JSON.parse(localStorage.getItem('aioniacs_ui_submemos_state'));
    expect(saved.revealedIds).toContain(memo.id);
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
