import * as Vue from "vue";
global.Vue = Vue;
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import CharacterHub from "../../../src/components/ui/CharacterHub.vue";
import { useUiStore } from "../../../src/stores/uiStore.js";

describe("CharacterHub", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  test("shows mark for corrupted characters", async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.driveCharacters = [
      { id: "1", name: "a.json", characterName: "A", isCorrupted: true },
      { id: "2", name: "b.json", characterName: "B" },
    ];
    const wrapper = mount(CharacterHub, {
      props: { dataManager: {}, loadCharacter: vi.fn(), saveToDrive: vi.fn() },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("🚫 A");
    expect(wrapper.text()).toContain("B");
  });
});
