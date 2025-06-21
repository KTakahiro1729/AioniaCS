vi.mock("../../../src/composables/useModal.js", () => ({
  useModal: vi.fn(),
}));

vi.mock("../../../src/composables/usePrint.js", () => ({
  openPreviewPage: vi.fn(),
}));

vi.mock("../../../src/utils/device.js", () => ({
  isDesktopDevice: vi.fn(),
}));

import { setActivePinia, createPinia } from "pinia";
import { useModal } from "../../../src/composables/useModal.js";
import { useAppModals } from "../../../src/composables/useAppModals.js";
import { openPreviewPage } from "../../../src/composables/usePrint.js";
import { isDesktopDevice } from "../../../src/utils/device.js";

function createOptions(printFn) {
  return {
    dataManager: {},
    loadCharacterById: () => {},
    saveCharacterToDrive: () => {},
    handleSignInClick: () => {},
    handleSignOutClick: () => {},
    refreshHubList: () => {},
    saveNewCharacter: () => {},
    saveData: () => {},
    handleFileUpload: () => {},
    outputToCocofolia: () => {},
    printCharacterSheet: printFn,
    promptForDriveFolder: () => {},
    copyEditCallback: () => {},
  };
}

describe("useAppModals openIoModal", () => {
  let showModalMock;
  beforeEach(() => {
    setActivePinia(createPinia());
    showModalMock = vi.fn().mockResolvedValue({});
    useModal.mockReturnValue({ showModal: showModalMock });
    openPreviewPage.mockClear();
    isDesktopDevice.mockReset();
  });

  test("uses printCharacterSheet on desktop", async () => {
    const printMock = vi.fn();
    isDesktopDevice.mockReturnValue(true);
    const { openIoModal } = useAppModals(createOptions(printMock));
    await openIoModal();
    const opts = showModalMock.mock.calls[0][0];
    await opts.on.print();
    expect(printMock).toHaveBeenCalled();
    expect(openPreviewPage).not.toHaveBeenCalled();
  });

  test("opens preview page on mobile", async () => {
    const printMock = vi.fn();
    isDesktopDevice.mockReturnValue(false);
    const { openIoModal } = useAppModals(createOptions(printMock));
    await openIoModal();
    const opts = showModalMock.mock.calls[0][0];
    await opts.on.print();
    expect(printMock).not.toHaveBeenCalled();
    expect(openPreviewPage).toHaveBeenCalled();
  });
});
