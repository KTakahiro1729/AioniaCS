import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { GoogleDriveManager } from '../services/googleDriveManager.js';

export function useGoogleDrive(
  character,
  skills,
  specialSkills,
  equipments,
  histories,
  dataManager,
) {
  const driveMenuToggleButton = ref(null);
  const driveMenu = ref(null);

  const isSignedIn = ref(false);
  const googleUser = ref(null);
  const driveFolderId = ref(null);
  const driveFolderName = ref('');
  const currentDriveFileId = ref(null);
  const currentDriveFileName = ref('');
  const driveStatusMessage = ref('');
  const isGapiInitialized = ref(false);
  const isGisInitialized = ref(false);
  const showDriveMenu = ref(false);
  const googleDriveManager = ref(null);
  const isCloudSaveSuccess = ref(false);

  const canSignInToGoogle = computed(
    () => isGapiInitialized.value && isGisInitialized.value && !isSignedIn.value,
  );
  const canOperateDrive = computed(
    () => isSignedIn.value && driveFolderId.value,
  );

  const toggleDriveMenu = () => {
    showDriveMenu.value = !showDriveMenu.value;
  };

  const _checkDriveReadiness = (actionContext = 'operate') => {
    if (!googleDriveManager.value) {
      driveStatusMessage.value = 'Error: Drive Manager is not available.';
      return false;
    }
    if (!isSignedIn.value && actionContext !== 'sign in') {
      driveStatusMessage.value = `Error: Please sign in to ${actionContext}.`;
      return false;
    }
    return true;
  };

  const handleSignInClick = () => {
    showDriveMenu.value = false;
    if (!googleDriveManager.value) {
      driveStatusMessage.value = 'Error: Drive Manager not available.';
      return;
    }
    driveStatusMessage.value = 'Signing in... Please wait.';
    try {
      googleDriveManager.value.handleSignIn((error, authResult) => {
        if (error || !authResult || !authResult.signedIn) {
          isSignedIn.value = false;
          googleUser.value = null;
          driveStatusMessage.value =
            'Sign-in failed. ' +
            (error ? error.message || error.details || 'Please try again.' : 'Ensure pop-ups are enabled.');
        } else {
          isSignedIn.value = true;
          googleUser.value = { displayName: 'User' };
          driveStatusMessage.value = `Signed in. Folder: ${driveFolderName.value || 'Not selected'}`;
          if (!driveFolderId.value) {
            getOrPromptForDriveFolder();
          }
        }
      });
    } catch (err) {
      isSignedIn.value = false;
      googleUser.value = null;
      driveStatusMessage.value = 'Sign-in error: ' + (err.message || 'An unexpected error occurred.');
    }
  };

  const handleSignOutClick = () => {
    showDriveMenu.value = false;
    if (!_checkDriveReadiness('sign out')) return;
    driveStatusMessage.value = 'Signing out...';
    googleDriveManager.value.handleSignOut(() => {
      isSignedIn.value = false;
      googleUser.value = null;
      currentDriveFileId.value = null;
      currentDriveFileName.value = '';
      driveStatusMessage.value = 'Signed out.';
    });
  };

  const getOrPromptForDriveFolder = async () => {
    showDriveMenu.value = false;
    if (!_checkDriveReadiness('set up a folder')) return;
    driveStatusMessage.value = 'Accessing Google Drive folder...';
    const appFolderName = 'AioniaCS_Data';
    try {
      const folderInfo = await googleDriveManager.value.getOrCreateAppFolder(appFolderName);
      if (folderInfo && folderInfo.id) {
        driveFolderId.value = folderInfo.id;
        driveFolderName.value = folderInfo.name;
        localStorage.setItem('aioniaDriveFolderId', folderInfo.id);
        localStorage.setItem('aioniaDriveFolderName', folderInfo.name);
        driveStatusMessage.value = `Drive Folder: ${driveFolderName.value}`;
      } else {
        driveStatusMessage.value = 'Could not auto-setup Drive folder. Please choose one.';
        await promptForDriveFolder(false);
      }
    } catch (error) {
      driveStatusMessage.value = `Folder setup error: ${error.message || 'Please choose manually.'}`;
      await promptForDriveFolder(false);
    }
  };

  const promptForDriveFolder = async (isDirectClick = true) => {
    if (isDirectClick) showDriveMenu.value = false;
    if (!_checkDriveReadiness('select a folder')) return;
    driveStatusMessage.value = 'Opening Google Drive folder picker...';
    googleDriveManager.value.showFolderPicker((error, folder) => {
      if (error) {
        driveStatusMessage.value = `Folder selection error: ${error.message || 'Cancelled or failed.'}`;
      } else if (folder && folder.id) {
        driveFolderId.value = folder.id;
        driveFolderName.value = folder.name;
        localStorage.setItem('aioniaDriveFolderId', folder.id);
        localStorage.setItem('aioniaDriveFolderName', folder.name);
        driveStatusMessage.value = `Drive Folder: ${driveFolderName.value}`;
        currentDriveFileId.value = null;
        currentDriveFileName.value = '';
      } else {
        driveStatusMessage.value = driveFolderId.value ? `Drive Folder: ${driveFolderName.value}` : 'Folder selection cancelled.';
      }
    });
  };

  const handleSaveToDriveClick = async () => {
    if (!_checkDriveReadiness('save')) return;
    if (!driveFolderId.value) {
      driveStatusMessage.value = 'Drive folder not set. Please choose a folder first.';
      await promptForDriveFolder(false);
      if (!driveFolderId.value) {
        driveStatusMessage.value = 'Save cancelled: No Drive folder selected.';
        return;
      }
    }
    driveStatusMessage.value = `Saving to "${driveFolderName.value}"...`;
    const fileName = (character.name || 'Aionia_Character_Sheet').replace(/[\\/:*?"<>|]/g, '_') + '.json';
    try {
      const savedFile = await dataManager.value.saveDataToDrive(
        character,
        skills,
        specialSkills,
        equipments,
        histories,
        driveFolderId.value,
        currentDriveFileId.value,
        fileName,
      );
      if (savedFile && savedFile.id) {
        currentDriveFileId.value = savedFile.id;
        currentDriveFileName.value = savedFile.name;
        driveStatusMessage.value = `Saved: ${currentDriveFileName.value} to "${driveFolderName.value}".`;
        isCloudSaveSuccess.value = true;
        setTimeout(() => {
          isCloudSaveSuccess.value = false;
        }, 2000);
      } else {
        throw new Error('Save operation did not return expected file information.');
      }
    } catch (error) {
      driveStatusMessage.value = `Save error: ${error.message || 'Unknown error'}`;
    }
  };

  const handleLoadFromDriveClick = async () => {
    if (!_checkDriveReadiness('load')) return;
    driveStatusMessage.value = 'Opening Google Drive file picker...';
    googleDriveManager.value.showFilePicker(
      async (error, file) => {
        if (error) {
          driveStatusMessage.value = `File selection error: ${error.message || 'Cancelled or failed.'}`;
          return;
        }
        if (!file || !file.id) {
          driveStatusMessage.value = 'File selection cancelled or no file chosen.';
          return;
        }
        driveStatusMessage.value = `Loading ${file.name} from Drive...`;
        try {
          const parsedData = await dataManager.value.loadDataFromDrive(file.id);
          if (parsedData) {
            Object.assign(character, parsedData.character);
            skills.splice(0, skills.length, ...parsedData.skills);
            specialSkills.splice(0, specialSkills.length, ...parsedData.specialSkills);
            Object.assign(equipments, parsedData.equipments);
            histories.splice(0, histories.length, ...parsedData.histories);
            currentDriveFileId.value = file.id;
            currentDriveFileName.value = file.name;
            driveStatusMessage.value = `Loaded: ${currentDriveFileName.value} from Drive.`;
          } else {
            throw new Error('Load operation did not return data.');
          }
        } catch (err) {
          driveStatusMessage.value = `Load error for ${file.name || 'file'}: ${err.message || 'Unknown error'}`;
        }
      },
      driveFolderId.value || null,
      ['application/json'],
    );
  };

  // Watchers
  let driveMenuClickListener = null;
  watch(showDriveMenu, (newValue) => {
    if (driveMenuClickListener) {
      document.removeEventListener('click', driveMenuClickListener, true);
      driveMenuClickListener = null;
    }
    if (newValue) {
      nextTick(() => {
        const menuEl = driveMenu.value;
        const toggleButtonEl = driveMenuToggleButton.value;
        if (menuEl && toggleButtonEl) {
          driveMenuClickListener = (event) => {
            if (!menuEl.contains(event.target) && !toggleButtonEl.contains(event.target)) {
              showDriveMenu.value = false;
            }
          };
          document.addEventListener('click', driveMenuClickListener, true);
        }
      });
    }
  });

  onMounted(() => {
    if (window.GoogleDriveManager) {
      const apiKey = 'AIzaSyBXvh_XH2XdHedIO5AaZKWLl1NJm7UAHnU';
      const clientId = '913887099800-5pkljcl9uua4ktealpbndilam9i1q1dg.apps.googleusercontent.com';
      googleDriveManager.value = new GoogleDriveManager(apiKey, clientId);
      dataManager.value.setGoogleDriveManager(googleDriveManager.value);

      const handleGapiLoaded = async () => {
        if (isGapiInitialized.value || !googleDriveManager.value) return;
        isGapiInitialized.value = true;
        driveStatusMessage.value = 'Google API Client: Loading...';
        try {
          await googleDriveManager.value.onGapiLoad();
          driveStatusMessage.value = isSignedIn.value
            ? `Signed in. Folder: ${driveFolderName.value || 'Not selected'}`
            : 'Google API Client: Ready. Please sign in.';
        } catch (err) {
          driveStatusMessage.value = 'Google API Client: Error initializing.';
          console.error('GAPI client init error:', err);
        }
      };

      const handleGisLoaded = async () => {
        if (isGisInitialized.value || !googleDriveManager.value) return;
        isGisInitialized.value = true;
        driveStatusMessage.value = 'Google Sign-In: Loading...';
        try {
          await googleDriveManager.value.onGisLoad();
          driveStatusMessage.value = isSignedIn.value
            ? `Signed in. Folder: ${driveFolderName.value || 'Not selected'}`
            : 'Google Sign-In: Ready. Please sign in.';
        } catch (err) {
          driveStatusMessage.value = 'Google Sign-In: Error initializing.';
          console.error('GIS client init error:', err);
        }
      };

      const gapiPoll = setInterval(() => {
        if (window.gapi && window.gapi.load) {
          handleGapiLoaded();
          clearInterval(gapiPoll);
        }
      }, 100);

      const gisPoll = setInterval(() => {
        if (window.google && window.google.accounts) {
          handleGisLoaded();
          clearInterval(gisPoll);
        }
      }, 100);
    }

    const savedFolderId = localStorage.getItem('aioniaDriveFolderId');
    const savedFolderName = localStorage.getItem('aioniaDriveFolderName');
    if (savedFolderId) {
      driveFolderId.value = savedFolderId;
      driveFolderName.value = savedFolderName || 'Previously Selected';
    }
  });

  onBeforeUnmount(() => {
    if (driveMenuClickListener) {
      document.removeEventListener('click', driveMenuClickListener, true);
    }
  });

  return {
    driveMenuToggleButton,
    driveMenu,
    isSignedIn,
    canSignInToGoogle,
    canOperateDrive,
    showDriveMenu,
    driveStatusMessage,
    isCloudSaveSuccess,
    toggleDriveMenu,
    handleSignInClick,
    handleSignOutClick,
    promptForDriveFolder,
    handleSaveToDriveClick,
    handleLoadFromDriveClick,
  };
}
