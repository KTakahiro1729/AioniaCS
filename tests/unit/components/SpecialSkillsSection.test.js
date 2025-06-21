import * as Vue from "vue";
global.Vue = Vue;
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import SpecialSkillsSection from "../../../src/components/sections/SpecialSkillsSection.vue";
import { useCharacterStore } from "../../../src/stores/characterStore.js";

describe("SpecialSkillsSection", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("group change resets note and toggles showNote", async () => {
    const wrapper = mount(SpecialSkillsSection);
    const store = useCharacterStore();
    const item = store.specialSkills[0];

    const groupSelect = wrapper.findAll("select.flex-item-1")[0];
    const nameSelect = wrapper.findAll("select.flex-item-2")[0];
    const noteInput = wrapper.findAll("input.special-skill-note-input")[0];

    await groupSelect.setValue("magic");
    await wrapper.vm.$nextTick();
    await nameSelect.setValue("ignite");
    await wrapper.vm.$nextTick();
    await noteInput.setValue("memo");
    await wrapper.vm.$nextTick();
    expect(item.note).toBe("memo");

    await groupSelect.setValue("free");
    await wrapper.vm.$nextTick();
    expect(item.note).toBe("");
    expect(item.showNote).toBe(true);

    await groupSelect.setValue("tactics");
    await wrapper.vm.$nextTick();
    expect(item.note).toBe("");
    expect(item.showNote).toBe(false);
  });
});
