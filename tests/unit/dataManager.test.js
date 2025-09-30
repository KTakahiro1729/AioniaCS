import { vi } from 'vitest';
import { DataManager } from '../../src/services/dataManager.js';
import { AioniaGameData } from '../../src/data/gameData.js';
import { deepClone } from '../../src/utils/utils.js';
import JSZip from 'jszip';

// vi.mock をファイルのトップレベルに記述します。
// これにより、Jestは 'tests/unit/__mocks__/jszip.js' を自動的に読み込みます。
vi.mock('jszip');

describe('DataManager', () => {
  let dm;
  let mockCharacter;
  let mockSkills;
  let mockSpecialSkills;
  let mockEquipments;
  let mockHistories;
  let currentFileReaderInstance;

  beforeEach(() => {
    // 各テストの前に、すべてのモックの状態をリセットします
    vi.clearAllMocks();

    dm = new DataManager(AioniaGameData);
    mockCharacter = deepClone(AioniaGameData.defaultCharacterData);
    mockCharacter.name = 'TestChar';
    mockSkills = deepClone(AioniaGameData.baseSkills);
    mockSpecialSkills = [];
    mockEquipments = {
      weapon1: { group: '', name: '' },
      weapon2: { group: '', name: '' },
      armor: { group: '', name: '' },
    };
    mockHistories = [{ sessionName: '', gotExperiments: null, memo: '' }];

    // ブラウザAPIのモック
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-url');
    global.URL.revokeObjectURL = vi.fn();
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
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    const mockAnchor = { click: vi.fn(), href: '', download: '' };
    document.createElement = vi.fn().mockReturnValue(mockAnchor);

    // FileReaderのモック
    global.FileReader = vi.fn().mockImplementation(() => {
      const readerInstance = {
        onload: null,
        onerror: null,
        result: null,
        readAsText: vi.fn(function (file) {
          this.result = JSON.stringify({
            character: { name: 'Loaded Char via readAsText' },
          });
          process.nextTick(() => {
            if (file && file.name === 'error.json' && this.onerror) {
              this.onerror(new Error('Mock JSON Read Error'));
            } else if (this.onload) {
              this.onload({ target: { result: this.result } });
            }
          });
        }),
        readAsArrayBuffer: vi.fn(function (file) {
          this.result = new ArrayBuffer(8);
          process.nextTick(() => {
            if (file && file.name === 'error.zip' && this.onerror) {
              this.onerror(new Error('Mock ZIP Read Error'));
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
    vi.restoreAllMocks();
  });

  test('convertExternalJsonToInternalFormat converts minimal data', () => {
    const external = {
      name: 'foo',
      player: 'bar',
      init_weakness1: 'fear',
      weapon1_type: 'sword',
      weapon1_name: 'blade',
      history: [{ name: 'sess1', experiments: '2', stress: 'note' }],
    };
    const internal = dm.convertExternalJsonToInternalFormat(external);
    expect(internal.character.name).toBe('foo');
    expect(internal.character.playerName).toBe('bar');
    expect(internal.character.weaknesses[0]).toEqual({
      text: 'fear',
      acquired: '作成時',
    });
    expect(internal.equipments.weapon1).toEqual({
      group: 'sword',
      name: 'blade',
    });
    expect(internal.histories[0]).toEqual({
      sessionName: 'sess1',
      gotExperiments: 2,
      memo: 'note',
      increasedScar: null,
    });
    expect(internal.character.images).toEqual([]);
  });

  test('_normalizeLoadedData fills defaults', () => {
    const result = dm._normalizeLoadedData({});
    expect(result.character.weaknesses).toHaveLength(AioniaGameData.config.maxWeaknesses);
    result.character.weaknesses.forEach((w) => expect(w).toEqual({ text: '', acquired: '--' }));
    expect(result.skills).toHaveLength(AioniaGameData.baseSkills.length);
    expect(result.histories).toEqual([{ sessionName: '', gotExperiments: null, memo: '', increasedScar: null }]);
    expect(result.character.linkCurrentToInitialScar).toBe(true);
    expect(result.character.images).toEqual([]);
  });

  test('_normalizeHistoryData returns default when empty', () => {
    expect(dm._normalizeHistoryData([])).toEqual([{ sessionName: '', gotExperiments: null, memo: '', increasedScar: null }]);
  });

  describe('saveData', () => {
    it('should save as JSON if no images are present', async () => {
      mockCharacter.images = [];
      await dm.saveData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories);
      expect(JSZip).not.toHaveBeenCalled();
      const mockAnchor = document.createElement.mock.results[0].value;
      expect(mockAnchor.download).toMatch(/^TestChar_\d{14}\.json$/);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('sanitizes character name before saving', async () => {
      mockCharacter.name = 'Inva:/\\*?<>|Name';
      mockCharacter.images = [];
      const sanitized = dm._sanitizeFileName(mockCharacter.name);
      await dm.saveData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories);
      const mockAnchor = document.createElement.mock.results[0].value;
      const regex = new RegExp(`^${sanitized}_\\d{14}\\.json$`);
      expect(mockAnchor.download).toMatch(regex);
    });

    it('should save as ZIP if images are present', async () => {
      mockCharacter.images = ['data:image/png;base64,mockimgdata1', 'data:image/jpeg;base64,mockimgdata2'];
      // `new JSZip()`が呼び出されたときのインスタンスの振る舞いを定義
      const mockZipInstance = {
        file: vi.fn(),
        folder: vi.fn().mockReturnThis(),
        generateAsync: vi.fn().mockResolvedValue(new Blob(['zip_blob_content'])),
      };
      JSZip.mockImplementation(() => mockZipInstance);

      await dm.saveData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories);
      expect(JSZip).toHaveBeenCalledTimes(1);
      expect(mockZipInstance.folder).toHaveBeenCalledWith('images');

      // fileメソッドの呼び出しを検証
      expect(mockZipInstance.file).toHaveBeenCalledWith('character_data.json', expect.any(String));
      expect(mockZipInstance.file).toHaveBeenCalledWith('image_0.png', 'mockimgdata1', { base64: true });
      expect(mockZipInstance.file).toHaveBeenCalledWith('image_1.jpeg', 'mockimgdata2', { base64: true });

      const jsonDataCall = mockZipInstance.file.mock.calls.find((call) => call[0] === 'character_data.json');
      const jsonDataInZip = JSON.parse(jsonDataCall[1]);
      expect(jsonDataInZip.character.images).toBeUndefined();
      expect(mockZipInstance.generateAsync).toHaveBeenCalledWith({
        type: 'blob',
      });
      const mockAnchor = document.createElement.mock.results[0].value;
      expect(mockAnchor.download).toMatch(/^TestChar_\d{14}\.zip$/);
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('handleFileUpload', () => {
    let onSuccessMock;
    let onErrorMock;

    beforeEach(() => {
      onSuccessMock = vi.fn();
      onErrorMock = vi.fn();
    });

    it('should process JSON file correctly', async () => {
      const mockFile = new File(['{"character":{"name":"TestOriginal"}}'], 'test.json', { type: 'application/json' });
      const mockEvent = { target: { files: [mockFile], value: '' } };
      await new Promise((resolve) => {
        onSuccessMock.mockImplementation(resolve);
        onErrorMock.mockImplementation(resolve);
        dm.handleFileUpload(mockEvent, onSuccessMock, onErrorMock);
      });
      expect(currentFileReaderInstance.readAsText).toHaveBeenCalledWith(mockFile);
      expect(onSuccessMock).toHaveBeenCalled();
      expect(onSuccessMock.mock.calls[0][0].character.name).toBe('Loaded Char via readAsText');
    });

    it('should process ZIP file correctly', async () => {
      const mockJsonDataInZip = {
        character: { name: 'Zippy', playerName: 'PlayerZippy' },
      };
      const mockJsonStringInZip = JSON.stringify(mockJsonDataInZip);
      const mockImageBase64Data = 'mockimagedatafromzip';
      const mockImageFileName = 'image_0.png';
      const mockZipInstance = {
        file: vi
          .fn()
          .mockImplementation((filename) =>
            filename === 'character_data.json' ? { async: vi.fn().mockResolvedValue(mockJsonStringInZip) } : null,
          ),
        folder: vi.fn().mockImplementation((folderName) => {
          if (folderName === 'images') {
            const imageFileEntry = {
              name: `images/${mockImageFileName}`,
              dir: false,
              async: vi.fn().mockResolvedValue(mockImageBase64Data),
            };
            return {
              forEach: (callback) => callback(mockImageFileName, imageFileEntry),
            };
          }
          return { forEach: vi.fn() };
        }),
      };
      JSZip.loadAsync.mockResolvedValue(mockZipInstance);
      const mockZipFileObj = new File(['zip_content_array_buffer'], 'test.zip', { type: 'application/zip' });
      const mockEvent = { target: { files: [mockZipFileObj], value: '' } };
      await new Promise((resolve) => {
        onSuccessMock.mockImplementation(resolve);
        onErrorMock.mockImplementation(resolve);
        dm.handleFileUpload(mockEvent, onSuccessMock, onErrorMock);
      });
      expect(currentFileReaderInstance.readAsArrayBuffer).toHaveBeenCalledWith(mockZipFileObj);
      expect(JSZip.loadAsync).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalled();
      const resultData = onSuccessMock.mock.calls[0][0];
      expect(resultData.character.name).toBe('Zippy');
      expect(resultData.character.images).toHaveLength(1);
      expect(resultData.character.images[0]).toBe(`data:image/png;base64,${mockImageBase64Data}`);
    });

    it('should call onError if ZIP loading fails (e.g. character_data.json missing)', async () => {
      const mockZipInstance = {
        file: vi.fn().mockReturnValue(null),
        folder: vi.fn().mockReturnValue({ forEach: vi.fn() }),
      };
      JSZip.loadAsync.mockResolvedValue(mockZipInstance);
      const mockZipFileObj = new File(['zip_content'], 'test.zip', {
        type: 'application/zip',
      });
      const mockEvent = { target: { files: [mockZipFileObj], value: '' } };
      await new Promise((resolve) => {
        onSuccessMock.mockImplementation(resolve);
        onErrorMock.mockImplementation(resolve);
        dm.handleFileUpload(mockEvent, onSuccessMock, onErrorMock);
      });
      expect(currentFileReaderInstance.readAsArrayBuffer).toHaveBeenCalledWith(mockZipFileObj);
      expect(onErrorMock).toHaveBeenCalledWith(expect.stringContaining('ZIPファイルに character_data.json が見つかりません。'));
    });
  });

  describe('saveDataToAppData', () => {
    beforeEach(() => {
      dm.googleDriveManager = {
        createCharacterFile: vi.fn().mockResolvedValue({ id: '1', name: 'c.json' }),
        updateCharacterFile: vi.fn().mockResolvedValue({ id: '1', name: 'c.json' }),
        addIndexEntry: vi.fn().mockResolvedValue(),
        renameIndexEntry: vi.fn().mockResolvedValue(),
      };
    });

    test('creates new file and adds index when no id', async () => {
      const res = await dm.saveDataToAppData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories, null);
      expect(dm.googleDriveManager.createCharacterFile).toHaveBeenCalled();
      expect(dm.googleDriveManager.addIndexEntry).toHaveBeenCalledWith({
        id: '1',
        characterName: 'TestChar',
      });
      expect(res.id).toBe('1');
    });

    test('updates file when id exists and renames index', async () => {
      await dm.saveDataToAppData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories, '1');
      expect(dm.googleDriveManager.updateCharacterFile).toHaveBeenCalledWith('1', expect.any(Object));
      expect(dm.googleDriveManager.renameIndexEntry).toHaveBeenCalledWith('1', 'TestChar');
      expect(dm.googleDriveManager.addIndexEntry).not.toHaveBeenCalled();
    });
  });
});
