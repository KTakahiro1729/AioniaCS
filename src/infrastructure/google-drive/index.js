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
let runtimeUseMockDrive = useMockDrive;

function exposeDevGlobal(instance) {
  if (runtimeUseMockDrive && typeof window !== 'undefined') {
    window.__DRIVE_DEV__ = instance;
  }
}

function resolveInitializer() {
  if (!currentInitializer) {
    currentInitializer = runtimeUseMockDrive ? initializeMockGoogleDriveManager : initializeGoogleDriveManager;
  }
  return currentInitializer;
}

function resolveGetter() {
  if (!currentGetter) {
    currentGetter = runtimeUseMockDrive ? getMockGoogleDriveManagerInstance : getGoogleDriveManagerInstance;
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
  runtimeUseMockDrive = useMockDrive;
  if (runtimeUseMockDrive) {
    resetMockGoogleDriveManagerForTests();
  } else {
    resetGoogleDriveManagerForTests();
  }
}

export function fallbackToMockDriveManager(apiKey = env?.VITE_GOOGLE_API_KEY, clientId = env?.VITE_GOOGLE_CLIENT_ID) {
  if (runtimeUseMockDrive && sharedInstance) {
    return sharedInstance;
  }
  runtimeUseMockDrive = true;
  sharedInstance = null;
  currentInitializer = initializeMockGoogleDriveManager;
  currentGetter = getMockGoogleDriveManagerInstance;
  return initializeDriveManager(apiKey, clientId);
}

export function isUsingMockDrive() {
  return runtimeUseMockDrive;
}
