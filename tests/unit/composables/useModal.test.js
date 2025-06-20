vi.mock("../../../src/stores/modalStore.js", () => ({
  useModalStore: vi.fn(),
}));

import { useModalStore } from "../../../src/stores/modalStore.js";
import { useModal } from "../../../src/composables/useModal.js";

describe("useModal composable", () => {
  test("showModal proxies to store", () => {
    const showModalMock = vi.fn();
    useModalStore.mockReturnValue({ showModal: showModalMock });
    const { showModal } = useModal();
    const opts = { title: "t" };
    showModal(opts);
    expect(showModalMock).toHaveBeenCalledWith(opts);
  });
});
