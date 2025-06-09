// tests/setupTests.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Function to load and execute a script in the current JSDOM global context
const loadScript = (filePath) => {
  try {
    const absolutePath = path.resolve(__dirname, '..', filePath); // Resolves relative to project root
    const scriptContent = fs.readFileSync(absolutePath, 'utf8');

    // Create a context that includes the JSDOM window and its properties
    // JSDOM's window is available as 'global.window' or just 'window' in Jest's JSDOM environment
    const context = {
      window: global.window,
      document: global.document,
      navigator: global.navigator,
      console: console, // Make console available within the script's context
      setTimeout: global.setTimeout,
      clearTimeout: global.clearTimeout,
      requestAnimationFrame: global.requestAnimationFrame,
      cancelAnimationFrame: global.cancelAnimationFrame,
      // Add other globals that scripts might expect, if any
    };
    vm.createContext(context); // Node.js vm module context
    vm.runInContext(scriptContent, context, { filename: absolutePath });

  } catch (error) {
    console.error(`Failed to load script ${filePath}:`, error);
    throw error; // Re-throw to fail the test setup if a script can't load
  }
};

// --- Polyfills and Mocks for JSDOM environment ---

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock document.execCommand
global.document.execCommand = jest.fn((command) => {
  if (command === 'copy') {
    return true; // Simulate success for copy command
  }
  return false;
});

// Mock gapi and gis before GoogleDriveManager is loaded, if GoogleDriveManager tries to use them immediately
global.window.gapi = {
  load: jest.fn((name, callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  }),
  // Add other gapi mocks if necessary
};
global.window.google = {
  accounts: {
    id: {
      initialize: jest.fn(),
      prompt: jest.fn(),
      // Add other GIS mocks if necessary
    },
    oauth2: {
      initTokenClient: jest.fn().mockReturnValue({
        requestAccessToken: jest.fn(),
      }),
      hasGrantedAllScopes: jest.fn(),
      revoke: jest.fn(),
    }
  }
};

// You might need to mock localStorage if any script uses it upon loading
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global.window, 'localStorage', { value: localStorageMock, writable: true });


// --- Load Application Scripts ---
// Load scripts in dependency order
// These scripts are expected to attach properties to 'window' or define globals.

console.log('Loading global scripts for Jest test environment...');

loadScript('src/utils.js'); // For window.deepClone, createWeaknessArray etc.
console.log('src/utils.js loaded. window.deepClone should be available.');

loadScript('src/gameData.js'); // For window.AioniaGameData
console.log('src/gameData.js loaded. window.AioniaGameData should be available.');

loadScript('src/uiManager.js'); // For window.uiManager
console.log('src/uiManager.js loaded. window.uiManager should be available.');

loadScript('src/listManager.js'); // For window.listManager
console.log('src/listManager.js loaded. window.listManager should be available.');

// Potentially load other global scripts if tests depend on them, e.g.:
// loadScript('src/cocofoliaExporter.js'); // For window.CocofoliaExporter
// loadScript('src/imageManager.js'); // For window.ImageManager
// loadScript('src/googleDriveManager.js'); // For window.GoogleDriveManager, needs gapi/gis mocks above
// loadScript('src/dataManager.js'); // For window.DataManager, needs GoogleDriveManager if it uses it

console.log('Global scripts loaded.');

// The following were for debugging, can be removed or commented out
// fi = fs
// pth = path

// Example of how to check if they are loaded:
// if (typeof window.uiManager !== 'undefined') {
//   console.log('window.uiManager is defined in setupTests.js');
// } else {
//   console.error('window.uiManager is UNDEFINED in setupTests.js');
// }
// if (typeof window.AioniaGameData !== 'undefined') {
//   console.log('window.AioniaGameData is defined in setupTests.js');
// } else {
//   console.error('window.AioniaGameData is UNDEFINED in setupTests.js');
// }
