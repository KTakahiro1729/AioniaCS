import * as Vue from "vue";
global.Vue = Vue;
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import MainFooter from "../../../src/components/ui/MainFooter.vue";

describe("MainFooter", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("emits events on button click", async () => {
    const wrapper = mount(MainFooter, {
      props: {
        experienceStatusClass: "",
        currentExperiencePoints: 1,
        maxExperiencePoints: 2,
        experienceLabel: "EXP",
        isViewingShared: false,
        dataManager: {},
        signIn: () => {},
        saveTitle: "save",
        saveLabel: "save",
        saveIcon: "icon-svg-local-download",
        loadTitle: "load",
        loadLabel: "load",
        loadIcon: "icon-svg-local-upload",
        ioLabel: "io",
        shareLabel: "share",
        copyEditLabel: "copy",
      },
    });

    await wrapper.find(".footer-button--save").trigger("click");
    expect(wrapper.emitted("save")).toBeTruthy();

    await wrapper.find(".footer-button--io").trigger("click");
    expect(wrapper.emitted("io")).toBeTruthy();

    await wrapper.find(".footer-button--share").trigger("click");
    expect(wrapper.emitted("share")).toBeTruthy();
  });
});
