import { jest } from "@jest/globals";
import { DataManager } from "../../src/services/dataManager.js";
import { AioniaGameData } from "../../src/data/gameData.js";
import { deepClone } from "../../src/utils/utils.js";
import JSZip from "jszip";

// Hoist the mock for the 'jszip' module, which is the correct pattern for ES Modules.
jest.mock("jszip");

describe("DataManager", () => {
  let dm;
  let mockCharacter;
  let mockSkills;
  let mockSpecialSkills;
  let mockEquipments;
  let mockHistories;
  let currentFileReaderInstance;

  // Define mock functions for reuse within the test suite.
  const mockZipFile = jest.fn();
  const mockZipFolder = jest.fn().mockReturnValue({ file: mockZipFile });
  const mockZipGenerateAsync = jest.fn();

  beforeEach(() => {
    // Instantiate DataManager for each test.
    dm = new DataManager(AioniaGameData);

    // Clear all previous mock data and implementations to ensure test isolation.
    jest.clearAllMocks();

    // Set up the mock implementation for the JSZip constructor (default export).
    JSZip.mockImplementation(() => ({
      file: mockZipFile,
      folder: mockZipFolder,
      generateAsync: mockZipGenerateAsync,
    }));

    // Set up the mock for the static `loadAsync` method.
    JSZip.loadAsync = jest.fn();

    // Provide a default resolved value for the async mock function.
    mockZipGenerateAsync.mockResolvedValue(new Blob(["zip_blob_content"]));

    mockCharacter = deepClone(AioniaGameData.defaultCharacterData);
    mockCharacter.name = "TestChar";
    mockSkills = deepClone(AioniaGameData.baseSkills);
    mockSpecialSkills = [];
    mockEquipments = {
      weapon1: { group: "", name: "" },
      weapon2: { group: "", name: "" },
      armor: { group: "", name: "" },
    };
    mockHistories = [{ sessionName: "", gotExperiments: null, memo: "" }];

    // Mock browser APIs.
    global.URL.createObjectURL = jest
      .fn()
      .mockReturnValue("blob:http://localhost/mock-url");
    global.URL.revokeObjectURL = jest.fn();
    global.File = class MockFile {
      constructor(parts, name, options) {
        this.parts = parts;
        this.name = name;
        this.options = options;
      }
    };
    global.Blob = class MockBlob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    };
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    const mockAnchor = { click: jest.fn(), href: "", download: "" };
    document.createElement = jest.fn().mockReturnValue(mockAnchor);

    // Mock FileReader.
    global.FileReader = jest.fn().mockImplementation(() => {
      const readerInstance = {
        onload: null,
        onerror: null,
        result: null,
        readAsText: jest.fn(function (file) {
          this.result = JSON.stringify({
            character: { name: "Loaded Char via readAsText" },
          });
          process.nextTick(() => {
            if (file && file.name === "error.json" && this.onerror) {
              this.onerror(new Error("Mock JSON Read Error"));
            } else if (this.onload) {
              this.onload({ target: { result: this.result } });
            }
          });
        }),
        readAsArrayBuffer: jest.fn(function (file) {
          this.result = new ArrayBuffer(8);
          process.nextTick(() => {
            if (file && file.name === "error.zip" && this.onerror) {
              this.onerror(new Error("Mock ZIP Read Error"));
            } else if (this.onload) {
              this.onload({ target: { result: this.result } });
            }
          });
        }),
      };
      currentFileReaderInstance = readerInstance;
      return readerInstance;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("convertExternalJsonToInternalFormat converts minimal data", () => {
    const external = {
      name: "foo",
      player: "bar",
      init_weakness1: "fear",
      weapon1_type: "sword",
      weapon1_name: "blade",
      history: [{ name: "sess1", experiments: "2", stress: "note" }],
    };
    const internal = dm.convertExternalJsonToInternalFormat(external);
    expect(internal.character.name).toBe("foo");
    expect(internal.character.playerName).toBe("bar");
    expect(internal.character.weaknesses[0]).toEqual({
      text: "fear",
      acquired: "作成時",
    });
    expect(internal.equipments.weapon1).toEqual({
      group: "sword",
      name: "blade",
    });
    expect(internal.histories[0]).toEqual({
      sessionName: "sess1",
      gotExperiments: 2,
      memo: "note",
    });
    expect(internal.character.images).toEqual([]);
  });

  test("_normalizeLoadedData fills defaults", () => {
    const result = dm._normalizeLoadedData({});
    expect(result.character.weaknesses).toHaveLength(
      AioniaGameData.config.maxWeaknesses,
    );
    result.character.weaknesses.forEach((w) =>
      expect(w).toEqual({ text: "", acquired: "--" }),
    );
    expect(result.skills).toHaveLength(AioniaGameData.baseSkills.length);
    expect(result.histories).toEqual([
      { sessionName: "", gotExperiments: null, memo: "" },
    ]);
    expect(result.character.linkCurrentToInitialScar).toBe(true);
    expect(result.character.images).toEqual([]);
  });

  test("_normalizeHistoryData returns default when empty", () => {
    expect(dm._normalizeHistoryData([])).toEqual([
      { sessionName: "", gotExperiments: null, memo: "" },
    ]);
  });

  describe("saveData", () => {
    it("should save as JSON if no images are present", async () => {
      mockCharacter.images = [];
      await dm.saveData(
        mockCharacter,
        mockSkills,
        mockSpecialSkills,
        mockEquipments,
        mockHistories,
      );
      expect(JSZip).not.toHaveBeenCalled();
      const mockAnchor = document.createElement.mock.results[0].value;
      expect(mockAnchor.download).toMatch(/^TestChar_\d{14}\.json$/);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it("sanitizes character name before saving", async () => {
      mockCharacter.name = "Inva:/\\*?<>|Name";
      mockCharacter.images = [];
      const sanitized = dm._sanitizeFileName(mockCharacter.name);
      await dm.saveData(
        mockCharacter,
        mockSkills,
        mockSpecialSkills,
        mockEquipments,
        mockHistories,
      );
      const mockAnchor = document.createElement.mock.results[0].value;
      const regex = new RegExp(`^${sanitized}_\\d{14}\\.json$`);
      expect(mockAnchor.download).toMatch(regex);
    });

    it("should save as ZIP if images are present", async () => {
      mockCharacter.images = [
        "data:image/png;base64,mockimgdata1",
        "data:image/jpeg;base64,mockimgdata2",
      ];
      await dm.saveData(
        mockCharacter,
        mockSkills,
        mockSpecialSkills,
        mockEquipments,
        mockHistories,
      );
      expect(JSZip).toHaveBeenCalledTimes(1);
      expect(mockZipFolder).toHaveBeenCalledWith("images");
      expect(mockZipFile.mock.calls.length).toBe(3);
      expect(mockZipFile.mock.calls).toEqual([
        ["character_data.json", expect.any(String)],
        ["image_0.png", "mockimgdata1", { base64: true }],
        ["image_1.jpeg", "mockimgdata2", { base64: true }],
      ]);
      const jsonDataCall = mockZipFile.mock.calls.find(
        (call) => call[0] === "character_data.json",
      );
      const jsonDataInZip = JSON.parse(jsonDataCall[1]);
      expect(jsonDataInZip.character.images).toBeUndefined();
      expect(mockZipGenerateAsync).toHaveBeenCalledWith({ type: "blob" });
      const mockAnchor = document.createElement.mock.results[0].value;
      expect(mockAnchor.download).toMatch(/^TestChar_\d{14}\.zip$/);
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe("handleFileUpload", () => {
    let onSuccessMock;
    let onErrorMock;

    beforeEach(() => {
      onSuccessMock = jest.fn();
      onErrorMock = jest.fn();
    });

    it("should process JSON file correctly", async () => {
      const mockFile = new File(
        ['{"character":{"name":"TestOriginal"}}'],
        "test.json",
        { type: "application/json" },
      );
      const mockEvent = { target: { files: [mockFile], value: "" } };
      await new Promise((resolve) => {
        onSuccessMock.mockImplementation(resolve);
        onErrorMock.mockImplementation(resolve);
        dm.handleFileUpload(mockEvent, onSuccessMock, onErrorMock);
      });
      expect(currentFileReaderInstance.readAsText).toHaveBeenCalledWith(
        mockFile,
      );
      expect(onSuccessMock).toHaveBeenCalled();
      expect(onSuccessMock.mock.calls[0][0].character.name).toBe(
        "Loaded Char via readAsText",
      );
    });

    it("should process ZIP file correctly", async () => {
      const mockJsonDataInZip = {
        character: { name: "Zippy", playerName: "PlayerZippy" },
      };
      const mockJsonStringInZip = JSON.stringify(mockJsonDataInZip);
      const mockImageBase64Data = "mockimagedatafromzip";
      const mockImageFileName = "image_0.png";
      const mockZipInstance = {
        file: jest
          .fn()
          .mockImplementation((filename) =>
            filename === "character_data.json"
              ? { async: jest.fn().mockResolvedValue(mockJsonStringInZip) }
              : null,
          ),
        folder: jest.fn().mockImplementation((folderName) => {
          if (folderName === "images") {
            const imageFileEntry = {
              name: `images/${mockImageFileName}`,
              dir: false,
              async: jest.fn().mockResolvedValue(mockImageBase64Data),
            };
            return {
              forEach: (callback) =>
                callback(mockImageFileName, imageFileEntry),
            };
          }
          return { forEach: jest.fn() };
        }),
      };
      JSZip.loadAsync.mockResolvedValue(mockZipInstance);
      const mockZipFileObj = new File(
        ["zip_content_array_buffer"],
        "test.zip",
        { type: "application/zip" },
      );
      const mockEvent = { target: { files: [mockZipFileObj], value: "" } };
      await new Promise((resolve) => {
        onSuccessMock.mockImplementation(resolve);
        onErrorMock.mockImplementation(resolve);
        dm.handleFileUpload(mockEvent, onSuccessMock, onErrorMock);
      });
      expect(currentFileReaderInstance.readAsArrayBuffer).toHaveBeenCalledWith(
        mockZipFileObj,
      );
      expect(JSZip.loadAsync).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalled();
      const resultData = onSuccessMock.mock.calls[0][0];
      expect(resultData.character.name).toBe("Zippy");
      expect(resultData.character.images).toHaveLength(1);
      expect(resultData.character.images[0]).toBe(
        `data:image/png;base64,${mockImageBase64Data}`,
      );
    });

    it("should call onError if ZIP loading fails (e.g. character_data.json missing)", async () => {
      const mockZipInstance = {
        file: jest.fn().mockReturnValue(null),
        folder: jest.fn().mockReturnValue({ forEach: jest.fn() }),
      };
      JSZip.loadAsync.mockResolvedValue(mockZipInstance);
      const mockZipFileObj = new File(["zip_content"], "test.zip", {
        type: "application/zip",
      });
      const mockEvent = { target: { files: [mockZipFileObj], value: "" } };
      await new Promise((resolve) => {
        onSuccessMock.mockImplementation(resolve);
        onErrorMock.mockImplementation(resolve);
        dm.handleFileUpload(mockEvent, onSuccessMock, onErrorMock);
      });
      expect(currentFileReaderInstance.readAsArrayBuffer).toHaveBeenCalledWith(
        mockZipFileObj,
      );
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "ZIPファイルに character_data.json が見つかりません。",
        ),
      );
    });
  });
});
