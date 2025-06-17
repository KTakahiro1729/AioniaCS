import { setActivePinia, createPinia } from "pinia";
import { useModalStore } from "../../../src/stores/modalStore.js";

describe("modalStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("showModal sets state and resolves", async () => {
    const store = useModalStore();
    const promise = store.showModal({ title: "t", message: "m" });
    expect(store.isVisible).toBe(true);
    expect(store.title).toBe("t");
    store.resolveModal({ value: "ok" });
    await expect(promise).resolves.toEqual({ value: "ok" });
    expect(store.isVisible).toBe(false);
  });

  test("showModal accepts component", () => {
    const store = useModalStore();
    const component = { template: "<div />" };
    store.showModal({ component });
    expect(store.component).toBe(component);
  });
});
