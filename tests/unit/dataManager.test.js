import { vi } from 'vitest';
import { DataManager } from '../../src/services/dataManager.js';
import { AioniaGameData } from '../../src/data/gameData.js';
import { deepClone } from '../../src/utils/utils.js';
import JSZip from 'jszip';
import { CloudStorageService } from '../../src/services/cloudStorageService.js';

class MockApiManager {
  constructor() {
    this.store = new Map();
  }

  async listCharacters() {
    return {
      characters: Array.from(this.store.values()).map((entry) => ({
        id: entry.id,
        lastModified: entry.updatedAt,
      })),
    };
  }

  async getCharacter(id) {
    if (!this.store.has(id)) {
      const error = new Error('Character not found');
      error.status = 404;
      throw error;
    }
    return JSON.parse(JSON.stringify(this.store.get(id)));
  }

  async saveCharacter(data) {
    this.store.set(data.id, JSON.parse(JSON.stringify(data)));
    return { id: data.id };
  }

  async deleteCharacter(id) {
    this.store.delete(id);
    return { id };
  }
}

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
    dm.setCloudStorageService(new CloudStorageService({ apiManager: new MockApiManager() }));
    dm.setCloudUserId(`test-user-${Math.random()}`);
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
    global.Blob = vi.fn(function (parts, options) {
      this.parts = parts;
      this.options = options;
    });
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
    });
    expect(internal.character.images).toEqual([]);
  });

  test('_normalizeLoadedData fills defaults', () => {
    const result = dm._normalizeLoadedData({});
    expect(result.character.weaknesses).toHaveLength(AioniaGameData.config.maxWeaknesses);
    result.character.weaknesses.forEach((w) => expect(w).toEqual({ text: '', acquired: '--' }));
    expect(result.skills).toHaveLength(AioniaGameData.baseSkills.length);
    expect(result.histories).toEqual([{ sessionName: '', gotExperiments: null, memo: '' }]);
    expect(result.character.linkCurrentToInitialScar).toBe(true);
    expect(result.character.images).toEqual([]);
  });

  test('_normalizeHistoryData returns default when empty', () => {
    expect(dm._normalizeHistoryData([])).toEqual([{ sessionName: '', gotExperiments: null, memo: '' }]);
  });

  describe('saveData', () => {
    it('should save as JSON if no images are present', async () => {
      mockCharacter.images = [];
      await dm.saveData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories);
      expect(JSZip).not.toHaveBeenCalled();
      const mockAnchor = document.createElement.mock.results[0].value;
      expect(mockAnchor.download).toMatch(/^TestChar_\d{14}\.json$/);
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(global.Blob).toHaveBeenCalledWith(expect.any(Array), { type: 'application/json' });
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

    it('keeps image URLs inside the exported JSON payload', async () => {
      mockCharacter.images = ['https://cdn.example.com/image1.png', 'https://cdn.example.com/image2.png'];

      await dm.saveData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories);

      expect(JSZip).not.toHaveBeenCalled();
      const blobCall = global.Blob.mock.calls[0];
      const jsonString = blobCall[0][0];
      const parsed = JSON.parse(jsonString);
      expect(parsed.character.images).toEqual(mockCharacter.images);

      const mockAnchor = document.createElement.mock.results[0].value;
      expect(mockAnchor.download).toMatch(/^TestChar_\d{14}\.json$/);
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
    test('creates new file and adds index when no id', async () => {
      const res = await dm.saveDataToAppData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories, null);
      expect(res).toHaveProperty('id');
      const list = await dm.loadCharacterListFromCloud();
      expect(list).toEqual(expect.arrayContaining([expect.objectContaining({ id: res.id, characterName: 'TestChar' })]));
    });

    test('updates file when id exists and renames index', async () => {
      const created = await dm.saveDataToAppData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories, null);
      mockCharacter.name = 'Updated Name';
      await dm.saveDataToAppData(mockCharacter, mockSkills, mockSpecialSkills, mockEquipments, mockHistories, created.id);
      const list = await dm.loadCharacterListFromCloud();
      expect(list).toHaveLength(1);
      expect(list[0]).toEqual(expect.objectContaining({ id: created.id, characterName: 'Updated Name' }));
      const stored = await dm.loadCloudCharacter(created.id);
      expect(stored.character.name).toBe('Updated Name');
    });
  });
});
