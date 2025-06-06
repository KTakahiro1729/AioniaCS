// tests/unit/dataManager.test.js

// Set up global window object and load utilities
global.window = {};
require("../../src/utils.js"); // Defines deepClone, createWeaknessArray on window
require("../../src/gameData.js"); // Defines AioniaGameData on window
global.deepClone = window.deepClone;
global.createWeaknessArray = window.createWeaknessArray;

// Mock JSZip
const mockZipFile = jest.fn();
const mockZipFolder = jest.fn().mockReturnValue({ file: mockZipFile });
const mockZipGenerateAsync = jest
  .fn()
  .mockResolvedValue(new Blob(["zip_blob_content"]));
global.JSZip = jest.fn().mockImplementation(() => ({
  file: mockZipFile,
  folder: mockZipFolder,
  generateAsync: mockZipGenerateAsync,
}));
global.JSZip.loadAsync = jest.fn();

// Load DataManager after mocks for JSZip are set up
require("../../src/dataManager.js");

const DataManager = window.DataManager;
const gameData = window.AioniaGameData;

describe("DataManager", () => {
  let dm;
  let mockCharacter;
  let mockSkills;
  let mockSpecialSkills;
  let mockEquipments;
  let mockHistories;
  let currentFileReaderInstance;

  beforeEach(() => {
    dm = new DataManager(gameData);

    JSZip.mockClear();
    mockZipFile.mockClear();
    mockZipFolder.mockClear();
    mockZipGenerateAsync.mockClear();
    JSZip.loadAsync.mockClear();

    mockCharacter = deepClone(gameData.defaultCharacterData);
    mockCharacter.name = "TestChar";
    mockSkills = deepClone(gameData.baseSkills);
    mockSpecialSkills = [];
    mockEquipments = {
      weapon1: { group: "", name: "" },
      weapon2: { group: "", name: "" },
      armor: { group: "", name: "" },
    };
    mockHistories = [{ sessionName: "", gotExperiments: null, memo: "" }];

    global.URL.createObjectURL = jest
      .fn()
      .mockReturnValue("blob:http://localhost/mock-url");
    global.URL.revokeObjectURL = jest.fn();
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    const mockAnchor = { click: jest.fn(), href: "", download: "" };
    document.createElement = jest.fn().mockReturnValue(mockAnchor);

    // Global FileReader mock
    global.FileReader = jest.fn().mockImplementation(() => {
      const readerInstance = {
        onload: null, // This will be set by DataManager
        onerror: null, // This will be set by DataManager
        result: null,
        readAsText: jest.fn(function (file) {
          // 'this' refers to readerInstance
          this.result = JSON.stringify({
            character: { name: "Loaded Char via readAsText" },
          });
          process.nextTick(() => {
            // Simulate async
            if (file && file.name === "error.json" && this.onerror) {
              this.onerror(new Error("Mock JSON Read Error"));
            } else if (this.onload) {
              this.onload({ target: { result: this.result } });
            }
          });
        }),
        readAsArrayBuffer: jest.fn(function (file) {
          // 'this' refers to readerInstance
          this.result = new ArrayBuffer(8); // Represents some zip content
          process.nextTick(() => {
            // Simulate async
            if (file && file.name === "error.zip" && this.onerror) {
              this.onerror(new Error("Mock ZIP Read Error"));
            } else if (this.onload) {
              this.onload({ target: { result: this.result } });
            }
          });
        }),
      };
      currentFileReaderInstance = readerInstance; // So tests can assert calls on its methods
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
      gameData.config.maxWeaknesses,
    );
    result.character.weaknesses.forEach((w) =>
      expect(w).toEqual({ text: "", acquired: "--" }),
    );
    expect(result.skills).toHaveLength(gameData.baseSkills.length);
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
      expect(mockZipFolder).toHaveBeenCalledWith("images"); // Ensure folder('images') was called

      // Verify all calls to zip.file() and imageFolder.file() which share mockZipFile
      expect(mockZipFile.mock.calls.length).toBe(3);
      expect(mockZipFile.mock.calls).toEqual([
        ["character_data.json", expect.any(String)], // Call for character_data.json (no options)
        ["image_0.png", "mockimgdata1", { base64: true }], // Path is relative to the folder in the call
        ["image_1.jpeg", "mockimgdata2", { base64: true }], // Path is relative to the folder in the call
      ]);

      // Check that character.images was deleted from the JSON data within the zip
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
        onErrorMock.mockImplementation(resolve); // Also resolve on error for test to finish
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
      }; // images will be added
      const mockJsonStringInZip = JSON.stringify(mockJsonDataInZip);
      const mockImageBase64Data = "mockimagedatafromzip";
      const mockImageFileName = "image_0.png";

      const mockZipInstance = {
        file: jest.fn().mockImplementation((filename) => {
          if (filename === "character_data.json") {
            return { async: jest.fn().mockResolvedValue(mockJsonStringInZip) };
          }
          return null;
        }),
        folder: jest.fn().mockImplementation((folderName) => {
          if (folderName === "images") {
            const imageFileEntry = {
              name: `images/${mockImageFileName}`,
              dir: false,
              async: jest.fn().mockResolvedValue(mockImageBase64Data),
            };
            return {
              forEach: (callback) => {
                callback(mockImageFileName, imageFileEntry);
              },
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
