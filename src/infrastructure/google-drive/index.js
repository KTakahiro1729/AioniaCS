import { getGoogleDriveManagerInstance, initializeGoogleDriveManager, resetGoogleDriveManagerForTests } from './googleDriveManager.js';
import {
  getMockGoogleDriveManagerInstance,
  initializeMockGoogleDriveManager,
  resetMockGoogleDriveManagerForTests,
} from './mockGoogleDriveManager.js';

const env = typeof import.meta !== 'undefined' ? import.meta.env : process.env;
const useMockDrive = env?.VITE_USE_MOCK_DRIVE === 'true';

let sharedInstance = null;
let currentInitializer = null;
let currentGetter = null;

function exposeDevGlobal(instance) {
  if (useMockDrive && typeof window !== 'undefined') {
    window.__DRIVE_DEV__ = instance;
  }
}

function resolveInitializer() {
  if (!currentInitializer) {
    currentInitializer = useMockDrive ? initializeMockGoogleDriveManager : initializeGoogleDriveManager;
  }
  return currentInitializer;
}

function resolveGetter() {
  if (!currentGetter) {
    currentGetter = useMockDrive ? getMockGoogleDriveManagerInstance : getGoogleDriveManagerInstance;
  }
  return currentGetter;
}

export function initializeDriveManager(apiKey, clientId) {
  if (sharedInstance) {
    return sharedInstance;
  }
  const initializer = resolveInitializer();
  sharedInstance = initializer(apiKey, clientId);
  exposeDevGlobal(sharedInstance);
  return sharedInstance;
}

export function getDriveManagerInstance() {
  if (sharedInstance) {
    return sharedInstance;
  }
  const getter = resolveGetter();
  try {
    sharedInstance = getter();
  } catch {
    sharedInstance = initializeDriveManager(env?.VITE_GOOGLE_API_KEY, env?.VITE_GOOGLE_CLIENT_ID);
  }
  exposeDevGlobal(sharedInstance);
  return sharedInstance;
}

export function resetDriveManagerForTests() {
  sharedInstance = null;
  currentInitializer = null;
  currentGetter = null;
  if (useMockDrive) {
    resetMockGoogleDriveManagerForTests();
  } else {
    resetGoogleDriveManagerForTests();
  }
}

export function isUsingMockDrive() {
  return useMockDrive;
}
