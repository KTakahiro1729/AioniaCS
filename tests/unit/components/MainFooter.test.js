import * as Vue from "vue";
global.Vue = Vue;
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import MainFooter from "../../../src/components/ui/MainFooter.vue";
import { useUiStore } from "../../../src/stores/uiStore.js";

describe("MainFooter", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("local save and file upload when signed out", async () => {
    const saveLocal = vi.fn();
    const fileUpload = vi.fn();
    const wrapper = mount(MainFooter, {
      props: {
        experienceStatusClass: "",
        currentExperiencePoints: 1,
        maxExperiencePoints: 2,
        experienceLabel: "EXP",
        isViewingShared: false,
        saveLocal,
        handleFileUpload: fileUpload,
        openHub: vi.fn(),
        saveToDrive: vi.fn(),
        ioLabel: "io",
        shareLabel: "share",
        copyEditLabel: "copy",
      },
    });
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    await wrapper.find(".footer-button--save").trigger("click");
    expect(saveLocal).toHaveBeenCalled();
    await wrapper.find("#load_input_vue").trigger("change");
    expect(fileUpload).toHaveBeenCalled();
  });

  test("drive actions when signed in", async () => {
    const saveDrive = vi.fn();
    const openHub = vi.fn();
    const wrapper = mount(MainFooter, {
      props: {
        experienceStatusClass: "",
        currentExperiencePoints: 1,
        maxExperiencePoints: 2,
        experienceLabel: "EXP",
        isViewingShared: false,
        saveLocal: vi.fn(),
        handleFileUpload: vi.fn(),
        openHub,
        saveToDrive: saveDrive,
        ioLabel: "io",
        shareLabel: "share",
        copyEditLabel: "copy",
      },
    });
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.currentDriveFileId = null;
    await wrapper.find(".footer-button--save").trigger("click");
    expect(saveDrive).toHaveBeenCalled();
    await wrapper.find(".footer-button--load").trigger("click");
    expect(openHub).toHaveBeenCalled();
    uiStore.currentDriveFileId = "id";
    await wrapper.find(".footer-button--save").trigger("click");
    expect(saveDrive).toHaveBeenCalledTimes(2);
  });

  test("shows repair buttons for corrupted data", async () => {
    const restore = vi.fn();
    const del = vi.fn();
    const wrapper = mount(MainFooter, {
      props: {
        experienceStatusClass: "",
        currentExperiencePoints: 1,
        maxExperiencePoints: 2,
        experienceLabel: "EXP",
        isViewingShared: false,
        saveLocal: vi.fn(),
        handleFileUpload: vi.fn(),
        openHub: vi.fn(),
        saveToDrive: vi.fn(),
        restore,
        deleteFull: del,
        removePointer: vi.fn(),
        ioLabel: "io",
        shareLabel: "share",
        copyEditLabel: "copy",
      },
    });
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.driveCharacters.push({
      id: "x",
      name: "x.json",
      isCorrupted: true,
      recoverable: true,
    });
    uiStore.currentDriveFileId = "x";
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("キャラクターを復元");
    await wrapper.findAll("button")[0].trigger("click");
    expect(restore).toHaveBeenCalled();
  });
});
