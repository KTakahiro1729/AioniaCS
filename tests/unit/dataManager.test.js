// tests/unit/dataManager.test.js

// Set up global window object and load utilities
global.window = {};
require('../../src/utils.js'); // Defines deepClone, createWeaknessArray on window
require('../../src/gameData.js'); // Defines AioniaGameData on window
global.deepClone = window.deepClone;
global.createWeaknessArray = window.createWeaknessArray;

// Mock JSZip
const mockZipFile = jest.fn();
const mockZipFolder = jest.fn().mockReturnValue({ file: mockZipFile });
const mockZipGenerateAsync = jest.fn().mockResolvedValue(new Blob(['zip_blob_content']));
global.JSZip = jest.fn().mockImplementation(() => ({
  file: mockZipFile,
  folder: mockZipFolder,
  generateAsync: mockZipGenerateAsync,
}));
global.JSZip.loadAsync = jest.fn();


// Load DataManager after mocks for JSZip are set up
require('../../src/dataManager.js');

const DataManager = window.DataManager;
const gameData = window.AioniaGameData;

describe('DataManager', () => {
  let dm;
  let mockCharacter;
  let mockSkills;
  let mockSpecialSkills;
  let mockEquipments;
  let mockHistories;

  beforeEach(() => {
    dm = new DataManager(gameData);

    // Reset JSZip mocks for each test
    JSZip.mockClear();
    mockZipFile.mockClear();
    mockZipFolder.mockClear();
    mockZipGenerateAsync.mockClear();
    JSZip.loadAsync.mockClear();


    mockCharacter = deepClone(gameData.defaultCharacterData);
    mockCharacter.name = 'TestChar';
    mockSkills = deepClone(gameData.baseSkills);
    mockSpecialSkills = [];
    mockEquipments = { weapon1: { group: '', name: '' }, weapon2: { group: '', name: '' }, armor: { group: '', name: '' } };
    mockHistories = [{ sessionName: '', gotExperiments: null, memo: '' }];

    // Mock URL.createObjectURL and anchor element for download simulation
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/mock-url');
    global.URL.revokeObjectURL = jest.fn();
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    const mockAnchor = { click: jest.fn(), href: '', download: '' };
    document.createElement = jest.fn().mockReturnValue(mockAnchor);
  });

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
  });


  test('convertExternalJsonToInternalFormat converts minimal data', () => {
    const external = {
      name: 'foo',
      player: 'bar',
      init_weakness1: 'fear',
      weapon1_type: 'sword',
      weapon1_name: 'blade',
      history: [{ name: 'sess1', experiments: '2', stress: 'note' }]
    };
    const internal = dm.convertExternalJsonToInternalFormat(external);
    expect(internal.character.name).toBe('foo');
    expect(internal.character.playerName).toBe('bar');
    expect(internal.character.weaknesses[0]).toEqual({ text: 'fear', acquired: '作成時' });
    expect(internal.equipments.weapon1).toEqual({ group: 'sword', name: 'blade' });
    expect(internal.histories[0]).toEqual({ sessionName: 'sess1', gotExperiments: 2, memo: 'note' });
    expect(internal.character.images).toEqual([]); // Ensure images array is initialized
  });

  test('_normalizeLoadedData fills defaults', () => {
    const result = dm._normalizeLoadedData({}); // Pass empty object
    expect(result.character.weaknesses).toHaveLength(gameData.config.maxWeaknesses);
    result.character.weaknesses.forEach(w => {
      expect(w).toEqual({ text: '', acquired: '--' });
    });
    expect(result.skills).toHaveLength(gameData.baseSkills.length);
    expect(result.histories).toEqual([{ sessionName: '', gotExperiments: null, memo: '' }]);
    expect(result.character.linkCurrentToInitialScar).toBe(true);
    expect(result.character.images).toEqual([]); // Ensure images array is initialized
  });

  test('_normalizeHistoryData returns default when empty', () => {
    expect(dm._normalizeHistoryData([])).toEqual([{ sessionName: '', gotExperiments: null, memo: '' }]);
  });

  describe('saveData', () => {
    it('should save as JSON if no images are present', async () => {
      mockCharacter.images = [];
      await dm.saveData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories);

      expect(JSZip).not.toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      const mockAnchor = document.createElement.mock.results[0].value;
      expect(mockAnchor.download).toBe('TestChar_AioniaSheet.json');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should save as ZIP if images are present', async () => {
      mockCharacter.images = ['data:image/png;base64,mockimgdata1', 'data:image/jpeg;base64,mockimgdata2'];
      await dm.saveData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories);

      expect(JSZip).toHaveBeenCalledTimes(1);
      expect(mockZipFile).toHaveBeenCalledWith("character_data.json", expect.any(String));
      expect(mockZipFolder).toHaveBeenCalledWith("images");

      // Check that character.images was deleted from the JSON data
      const jsonDataCall = mockZipFile.mock.calls.find(call => call[0] === "character_data.json");
      const jsonData = JSON.parse(jsonDataCall[1]);
      expect(jsonData.character.images).toBeUndefined();

      expect(mockZipFile).toHaveBeenCalledWith("images/image_0.png", "mockimgdata1", { base64: true });
      expect(mockZipFile).toHaveBeenCalledWith("images/image_1.jpeg", "mockimgdata2", { base64: true });
      expect(mockZipGenerateAsync).toHaveBeenCalledWith({ type: "blob" });

      expect(document.createElement).toHaveBeenCalledWith('a');
      const mockAnchor = document.createElement.mock.results[0].value;
      expect(mockAnchor.download).toBe('TestChar_AioniaSheet.zip');
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('handleFileUpload', () => {
    let onSuccessMock;
    let onErrorMock;

    beforeEach(() => {
      onSuccessMock = jest.fn();
      onErrorMock = jest.fn();
      global.FileReader = jest.fn(() => ({
        readAsText: jest.fn(function() { if(this.onload) this.onload({ target: { result: '{}' }}); }),
        readAsArrayBuffer: jest.fn(function() { if(this.onload) this.onload({ target: { result: new ArrayBuffer(0) }}); }),
        onload: null,
        onerror: null,
      }));
    });

    it('should process JSON file correctly', () => {
        const mockFile = new File(['{"character":{"name":"Test"}}'], 'test.json', { type: 'application/json' });
        const mockEvent = { target: { files: [mockFile], value: '' } };

        // Re-assign readAsText for this specific test to control its behavior
        FileReader.prototype.readAsText = jest.fn(function() {
            this.onload({ target: { result: '{"character":{"name":"Loaded Char"}}' }});
        });


        dm.handleFileUpload(mockEvent, onSuccessMock, onErrorMock);

        expect(FileReader.prototype.readAsText).toHaveBeenCalledWith(mockFile);
        expect(onSuccessMock).toHaveBeenCalled();
        expect(onSuccessMock.mock.calls[0][0].character.name).toBe('Loaded Char');
    });


    it('should process ZIP file correctly', async () => {
      const mockJsonData = { character: { name: 'Zippy', playerName: 'PlayerZippy', images: [] }, skills: [], specialSkills:[], equipments:{}, histories:[] };
      const mockJsonString = JSON.stringify(mockJsonData);
      const mockImageBase64 = "mockimagedatafromzip";
      const mockImageFileName = "image_0.png";

      const mockZipInstance = {
        file: jest.fn((filename) => {
          if (filename === "character_data.json") {
            return { async: jest.fn().mockResolvedValue(mockJsonString) };
          }
          // For image files under images/ folder
          if (filename.startsWith("images/")) {
             return { async: jest.fn().mockResolvedValue(mockImageBase64) };
          }
          return null;
        }),
        folder: jest.fn((folderName) => {
          if (folderName === "images") {
            // Simulate forEach on the folder object
            const imageFileEntry = {
                name: `images/${mockImageFileName}`, // JSZip provides full path here
                dir: false,
                async: jest.fn().mockResolvedValue(mockImageBase64)
            };
            return {
                forEach: (callback) => {
                    // relativePath for forEach is relative to the folder
                    callback(mockImageFileName, imageFileEntry);
                }
            };
          }
          return null;
        }),
      };
      JSZip.loadAsync.mockResolvedValue(mockZipInstance);

      // Mock file reader for array buffer
      FileReader.prototype.readAsArrayBuffer = jest.fn(function() {
        this.onload({ target: { result: new ArrayBuffer(8) } }); // Mock ArrayBuffer content
      });

      const mockZipFileObj = new File(['zipcontent'], 'test.zip', { type: 'application/zip' });
      const mockEvent = { target: { files: [mockZipFileObj], value: '' } };

      await dm.handleFileUpload(mockEvent, onSuccessMock, onErrorMock);

      expect(FileReader.prototype.readAsArrayBuffer).toHaveBeenCalledWith(mockZipFileObj);
      expect(JSZip.loadAsync).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalled();

      const resultData = onSuccessMock.mock.calls[0][0];
      expect(resultData.character.name).toBe('Zippy');
      expect(resultData.character.images).toHaveLength(1);
      expect(resultData.character.images[0]).toBe(`data:image/png;base64,${mockImageBase64}`);
    });

    it('should call onError if ZIP loading fails (e.g. character_data.json missing)', async () => {
        const mockZipInstance = {
            file: jest.fn().mockReturnValue(null), // Simulate character_data.json not found
            folder: jest.fn().mockReturnValue({ forEach: jest.fn() })
        };
        JSZip.loadAsync.mockResolvedValue(mockZipInstance);

        FileReader.prototype.readAsArrayBuffer = jest.fn(function() {
            this.onload({ target: { result: new ArrayBuffer(8) } });
        });

        const mockZipFileObj = new File(['zipcontent'], 'test.zip', { type: 'application/zip' });
        const mockEvent = { target: { files: [mockZipFileObj], value: '' } };

        await dm.handleFileUpload(mockEvent, onSuccessMock, onErrorMock);

        expect(onErrorMock).toHaveBeenCalledWith(expect.stringContaining("ZIPファイルに character_data.json が見つかりません。"));
    });
  });
});
