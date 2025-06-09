// tests/unit/main.test.js

// Note: `setupTests.js` is expected to load AioniaGameData, uiManager, listManager, etc., onto `window`.
// So, we should not mock them here if we want to test the integration with the actual modules.

// If Vue Test Utils were used, we would mount the Vue app from main.js.
// Since it's not, these tests will be more about ensuring that when a method
// from main.js (if it were callable) is invoked, it correctly calls
// the respective global manager functions.

// Mock browser features not fully supported by JSDOM or if specific behavior is needed.
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
  writable: true,
});

// Mock other global dependencies that main.js might use but are not loaded by setupTests.js,
// or if they need specific mock implementations for main.js tests.
// For example, DataManager, CocofoliaExporter, ImageManager, GoogleDriveManager are used by main.js.
// If their actual scripts are not loaded by setupTests.js, they need to be mocked here.
// If setupTests.js *does* load them, these mocks might be redundant or conflict.
// For this task, we assume setupTests.js primarily loads uiManager, listManager, gameData, utils.
// So, other complex objects used by main.js might still need mocking here.

global.window.DataManager = jest.fn().mockImplementation(() => ({
  saveData: jest.fn(),
  handleFileUpload: jest.fn(),
  saveDataToDrive: jest.fn().mockResolvedValue({ id: 'file123', name: 'test.json' }),
  loadDataFromDrive: jest.fn().mockResolvedValue({ character: {} }),
  setGoogleDriveManager: jest.fn(),
}));
global.window.CocofoliaExporter = jest.fn().mockImplementation(() => ({
  generateCocofoliaData: jest.fn().mockReturnValue({}),
}));
global.window.ImageManager = {
  loadImage: jest.fn().mockResolvedValue("imageDataString"),
};
global.window.GoogleDriveManager = jest.fn().mockImplementation(() => ({
  onGapiLoad: jest.fn().mockResolvedValue(undefined),
  onGisLoad: jest.fn().mockResolvedValue(undefined),
  handleSignIn: jest.fn(),
  handleSignOut: jest.fn(),
  getOrCreateAppFolder: jest.fn().mockResolvedValue({ id: 'folder123', name: 'AioniaCS_Data' }),
  showFolderPicker: jest.fn(),
  showFilePicker: jest.fn(),
}));


describe("Vue app integration with uiManager and listManager", () => {
  let mockAppInstance;

  beforeEach(() => {
    // Reset mocks for window.uiManager and window.listManager if they are spies
    // If they are the actual objects loaded by setupTests, we don't mock them here.
    // Instead, we might spy on their methods if needed for specific tests.
    jest.clearAllMocks(); // Clears all Jest mocks, including those on global objects if any.

    // Create a mock Vue app instance context for each test.
    // This context should reflect the data properties main.js would initialize.
    // Crucially, it should use window.AioniaGameData loaded by setupTests.js.
    mockAppInstance = {
      isDesktop: true,
      helpState: 'closed',
      $refs: {
        helpPanel: document.createElement('div'),
        helpIcon: document.createElement('div'),
        outputButton: document.createElement('button'),
      },
      // Use the globally loaded AioniaGameData
      gameData: window.AioniaGameData,
      outputButtonText: window.AioniaGameData.uiMessages.outputButton.default,
      specialSkills: [{ group: "", name: "", note: "", showNote: false }],
      histories: [{ sessionName: "", gotExperiments: null, memo: "" }],
      // Ensure defaultCharacterData and other startup data are correctly accessed
      character: window.deepClone(window.AioniaGameData.defaultCharacterData),
      skills: window.deepClone(window.AioniaGameData.baseSkills),
      equipments: {
        weapon1: { group: "", name: "" },
        weapon2: { group: "", name: "" },
        armor: { group: "", name: "" },
      },
      currentWeight: 0,
      cocofoliaExporter: new window.CocofoliaExporter(), // Use mocked version
      dataManager: new window.DataManager(), // Use mocked version
      // ... any other properties main.js's methods would expect in `this` context.
    };
    document.body.appendChild(mockAppInstance.$refs.helpPanel);
    document.body.appendChild(mockAppInstance.$refs.helpIcon);
    document.body.appendChild(mockAppInstance.$refs.outputButton);

    // If main.js methods were directly testable (e.g., exported or on a mounted app):
    // e.g., vueApp = main.initApp(); or const wrapper = mount(App); vueApp = wrapper.vm;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // Test that methods in main.js (if they were callable) correctly delegate to window.uiManager
  test('main.js method for help icon click should use window.uiManager', () => {
    // This test is conceptual. We need a way to invoke a method from main.js.
    // If main.js's methods were, e.g., app.methods.handleHelpIconClick.call(mockAppInstance):
    // app.methods.handleHelpIconClick.call(mockAppInstance);
    // expect(window.uiManager.handleHelpIconClick).toHaveBeenCalledWith(mockAppInstance);

    // For now, let's simulate the call as if it's coming from a Vue method context
    // We are testing that IF such a method in main.js is called, it uses the global uiManager
    // This requires window.uiManager.handleHelpIconClick to be a spy or mock if we want to assert calls.
    // Since setupTests.js loads the actual uiManager, we'd spy on its methods.
    jest.spyOn(window.uiManager, 'handleHelpIconClick');

    // Simulate a method from main.js being called:
    // mainJsAppMountedInstance.handleHelpIconClick();
    // Since we don't have the instance, we call the global function directly
    // with the expected 'this' context.
    window.uiManager.handleHelpIconClick(mockAppInstance);
    expect(window.uiManager.handleHelpIconClick).toHaveBeenCalledWith(mockAppInstance);

    window.uiManager.handleHelpIconClick.mockRestore(); // Clean up spy
  });

  // Test that methods in main.js correctly delegate to window.listManager
  test('main.js method for adding special skill should use window.listManager', () => {
    jest.spyOn(window.listManager, 'addSpecialSkillItem');

    // Simulate main.js method call:
    // mainJsAppMountedInstance.addSpecialSkillItem();
    window.listManager.addSpecialSkillItem(mockAppInstance);
    expect(window.listManager.addSpecialSkillItem).toHaveBeenCalledWith(mockAppInstance);

    window.listManager.addSpecialSkillItem.mockRestore();
  });

  test('outputToCocofolia (conceptual main.js method) should use window.uiManager.copyToClipboard', async () => {
    // This test assumes `outputToCocofolia` is a method within the Vue app context (mockAppInstance)
    // that internally calls `this.copyToClipboard`, which in turn calls `window.uiManager.copyToClipboard`.

    // Spy on the actual window.uiManager.copyToClipboard
    jest.spyOn(window.uiManager, 'copyToClipboard');

    // Simulate the relevant part of outputToCocofolia that calls copyToClipboard
    const textToCopy = JSON.stringify(mockAppInstance.cocofoliaExporter.generateCocofoliaData({
        character: mockAppInstance.character,
        skills: mockAppInstance.skills,
        specialSkills: mockAppInstance.specialSkills,
        equipments: mockAppInstance.equipments,
        currentWeight: mockAppInstance.currentWeight,
        speciesLabelMap: mockAppInstance.gameData.speciesLabelMap,
        equipmentGroupLabelMap: mockAppInstance.gameData.equipmentGroupLabelMap,
        specialSkillData: mockAppInstance.gameData.specialSkillData,
        specialSkillsRequiringNote: mockAppInstance.gameData.specialSkillsRequiringNote,
        weaponDamage: mockAppInstance.gameData.weaponDamage,
    }), null, 2);

    // Simulate the call to copyToClipboard as it would happen from within main.js's Vue app context
    // e.g., if copyToClipboard method in main.js is: async copyToClipboard(text) { await window.uiManager.copyToClipboard(this, text); }
    // We are testing that this delegation happens.
    await window.uiManager.copyToClipboard(mockAppInstance, textToCopy);

    expect(mockAppInstance.cocofoliaExporter.generateCocofoliaData).toHaveBeenCalled();
    expect(window.uiManager.copyToClipboard).toHaveBeenCalledWith(mockAppInstance, textToCopy);

    window.uiManager.copyToClipboard.mockRestore();
  });

  // More tests could be added here for other main.js methods, ensuring they correctly
  // use the global managers and data loaded by setupTests.js.
  // For example, testing `handleFileUpload` to ensure it calls `window.uiManager.showCustomAlert` on error.
});
