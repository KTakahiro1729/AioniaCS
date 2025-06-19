import * as Vue from "vue";
global.Vue = Vue;
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";
import ShareOptions from "../../../src/components/modals/contents/ShareOptions.vue";
import { useModalStore } from "../../../src/stores/modalStore.js";

describe("ShareOptions", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("generate button disabled when sign-in required", async () => {
    const modalStore = useModalStore();
    modalStore.buttons = [
      { label: "生成", value: "generate", variant: "primary" },
    ];
    const wrapper = mount(ShareOptions, {
      props: { signedIn: false, longData: false },
    });

    await wrapper.find('input[value="dynamic"]').setValue();
    await nextTick();
    expect(modalStore.buttons[0].disabled).toBe(true);

    await wrapper.setProps({ signedIn: true });
    await nextTick();
    expect(modalStore.buttons[0].disabled).toBe(false);
  });

  test("truncate warning shown only when full content disabled", async () => {
    const modalStore = useModalStore();
    modalStore.buttons = [
      { label: "生成", value: "generate", variant: "primary" },
    ];
    const wrapper = mount(ShareOptions, {
      props: { signedIn: true, longData: true },
    });
    expect(wrapper.find(".share-options__warning").exists()).toBe(true);

    await wrapper.find('input[type="checkbox"]').setChecked();
    await nextTick();
    expect(wrapper.find(".share-options__warning").exists()).toBe(false);
  });
});
