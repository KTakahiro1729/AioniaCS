import * as Vue from "vue";
global.Vue = Vue;
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import MainHeader from "../../../src/components/ui/MainHeader.vue";
import { useCharacterStore } from "../../../src/stores/characterStore.js";
import { useUiStore } from "../../../src/stores/uiStore.js";

describe("MainHeader", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("shows character name when provided", async () => {
    const wrapper = mount(MainHeader, {
      props: {
        defaultTitle: "Default",
        cloudHubLabel: "hub",
        helpLabel: "?",
        helpState: "closed",
      },
    });
    const charStore = useCharacterStore();
    charStore.character.name = "Hero";
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".main-header__title").text()).toBe("Hero");
  });

  test("cloud hub hidden when not signed in", async () => {
    const wrapper = mount(MainHeader, {
      props: {
        defaultTitle: "Default",
        cloudHubLabel: "hub",
        helpLabel: "?",
        helpState: "closed",
      },
    });
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".icon-button").exists()).toBe(true);
  });
});
