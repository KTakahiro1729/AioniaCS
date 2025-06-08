// src/googleDriveUIManager.js

export class GoogleDriveUIManager {
  constructor(vueAppContext) {
    this.app = vueAppContext; // vueAppContext is the Vue app instance from main.js
  }

  // --- Google Drive Methods ---
  async handleGapiLoaded() {
    if (this.app.isGapiInitialized || !this.app.googleDriveManager) return;
    this.app.isGapiInitialized = true;
    this.app.isGapiLoaded = true; // Keep track that the script itself has loaded
    this.app.driveStatusMessage = "Google API Client: Loading...";
    try {
      await this.app.googleDriveManager.onGapiLoad();
      this.app.driveStatusMessage = this.app.isSignedIn
        ? `Signed in. Folder: ${this.app.driveFolderName || "Not selected"}`
        : "Google API Client: Ready. Please sign in.";
    } catch (err) {
      this.app.driveStatusMessage = "Google API Client: Error initializing.";
      console.error("GAPI client init error in Vue app:", err);
    }
  }

  async handleGisLoaded() {
    if (this.app.isGisInitialized || !this.app.googleDriveManager) return;
    this.app.isGisInitialized = true;
    this.app.isGisLoaded = true; // Keep track that the script itself has loaded
    this.app.driveStatusMessage = "Google Sign-In: Loading...";
    try {
      await this.app.googleDriveManager.onGisLoad();
      this.app.driveStatusMessage = this.app.isSignedIn
        ? `Signed in. Folder: ${this.app.driveFolderName || "Not selected"}`
        : "Google Sign-In: Ready. Please sign in.";
    } catch (err) {
      this.app.driveStatusMessage = "Google Sign-In: Error initializing.";
      console.error("GIS client init error in Vue app:", err);
    }
  }

  async handleSignInClick() {
    this.app.showDriveMenu = false; // Close menu on action
    if (!this.app.googleDriveManager) {
      this.app.driveStatusMessage = "Error: Drive Manager not available.";
      return;
    }
    this.app.driveStatusMessage = "Signing in... Please wait.";
    try {
      // Assuming googleDriveManager.handleSignIn is already promisified or handles callbacks correctly
      this.app.googleDriveManager.handleSignIn((error, authResult) => {
        if (error || !authResult || !authResult.signedIn) {
          this.app.isSignedIn = false;
          this.app.googleUser = null;
          this.app.driveStatusMessage =
            "Sign-in failed. " +
            (error
              ? error.message || error.details || "Please try again."
              : "Ensure pop-ups are enabled.");
        } else {
          this.app.isSignedIn = true;
          // Assuming googleUser structure, adjust if necessary
          this.app.googleUser = { displayName: "User" }; // Or get from authResult if available
          this.app.driveStatusMessage = `Signed in. Folder: ${this.app.driveFolderName || "Not selected"}`;
          if (!this.app.driveFolderId) {
            this.getOrPromptForDriveFolder(); // Call method within the class
          }
        }
      });
    } catch (err) {
      this.app.isSignedIn = false;
      this.app.googleUser = null;
      this.app.driveStatusMessage =
        "Sign-in error: " + (err.message || "An unexpected error occurred.");
    }
  }

  handleSignOutClick() {
    this.app.showDriveMenu = false; // Close menu on action
    if (!this.app.googleDriveManager) {
      this.app.driveStatusMessage = "Error: Drive Manager not available.";
      return;
    }
    this.app.driveStatusMessage = "Signing out...";
    this.app.googleDriveManager.handleSignOut(() => {
      this.app.isSignedIn = false;
      this.app.googleUser = null;
      this.app.currentDriveFileId = null;
      this.app.currentDriveFileName = "";
      // this.app.driveFolderId = null; // User might want to keep the folder choice
      // this.app.driveFolderName = "";
      this.app.driveStatusMessage = "Signed out.";
    });
  }

  async getOrPromptForDriveFolder() {
    this.app.showDriveMenu = false; // Close menu on action
    if (!this._checkDriveReadiness("set up a folder")) {
      return;
    }
    this.app.driveStatusMessage = "Accessing Google Drive folder...";
    const appFolderName = "AioniaCS_Data"; // Consider making this configurable if needed
    try {
      const folderInfo =
        await this.app.googleDriveManager.getOrCreateAppFolder(appFolderName);
      if (folderInfo && folderInfo.id) {
        this.app.driveFolderId = folderInfo.id;
        this.app.driveFolderName = folderInfo.name;
        localStorage.setItem("aioniaDriveFolderId", folderInfo.id);
        localStorage.setItem("aioniaDriveFolderName", folderInfo.name);
        this.app.driveStatusMessage = `Drive Folder: ${this.app.driveFolderName}`;
      } else {
        this.app.driveStatusMessage =
          "Could not auto-setup Drive folder. Please choose one.";
        await this.promptForDriveFolder(false); // Call method within the class
      }
    } catch (error) {
      this.app.driveStatusMessage = `Folder setup error: ${error.message || "Please choose manually."}`;
      await this.promptForDriveFolder(false); // Call method within the class
    }
  }

  async promptForDriveFolder(isDirectClick = true) {
    if (isDirectClick) this.app.showDriveMenu = false; // Close menu on action
    if (!this._checkDriveReadiness("select a folder")) {
      return;
    }
    this.app.driveStatusMessage = "Opening Google Drive folder picker...";
    this.app.googleDriveManager.showFolderPicker((error, folder) => {
      if (error) {
        this.app.driveStatusMessage = `Folder selection error: ${error.message || "Cancelled or failed."}`;
      } else if (folder && folder.id) {
        this.app.driveFolderId = folder.id;
        this.app.driveFolderName = folder.name;
        localStorage.setItem("aioniaDriveFolderId", folder.id);
        localStorage.setItem("aioniaDriveFolderName", folder.name);
        this.app.driveStatusMessage = `Drive Folder: ${this.app.driveFolderName}`;
        this.app.currentDriveFileId = null; // Reset current file when folder changes
        this.app.currentDriveFileName = "";
      } else {
        this.app.driveStatusMessage = this.app.driveFolderId
          ? `Drive Folder: ${this.app.driveFolderName}`
          : "Folder selection cancelled.";
      }
    });
  }

  async handleSaveToDriveClick() {
    this.app.showDriveMenu = false; // Close menu on action
    if (!this._checkDriveReadiness("save")) {
      return;
    }

    if (!this.app.driveFolderId) {
      this.app.driveStatusMessage =
        "Drive folder not set. Please choose a folder first.";
      await this.promptForDriveFolder(false); // Call method within the class
      if (!this.app.driveFolderId) {
        this.app.driveStatusMessage = "Save cancelled: No Drive folder selected.";
        return;
      }
    }
    this.app.driveStatusMessage = `Saving to "${this.app.driveFolderName}"...`;
    const fileName =
      (this.app.character.name || "Aionia_Character_Sheet").replace(
        /[\/:*?"<>|]/g,
        "_",
      ) + ".json";

    // Data to be saved is prepared here, using app's dataManager and current character state
    // This relies on dataManager being set up on the app instance
    try {
      const savedFile = await this.app.dataManager.saveDataToDrive(
        this.app.character,
        this.app.skills,
        this.app.specialSkills,
        this.app.equipments,
        this.app.histories,
        this.app.driveFolderId,
        this.app.currentDriveFileId,
        fileName,
      );
      if (savedFile && savedFile.id) {
        this.app.currentDriveFileId = savedFile.id;
        this.app.currentDriveFileName = savedFile.name;
        this.app.driveStatusMessage = `Saved: ${this.app.currentDriveFileName} to "${this.app.driveFolderName}".`;
        this.app.isCloudSaveSuccess = true;
        setTimeout(() => {
          this.app.isCloudSaveSuccess = false;
        }, 2000);
      } else {
        throw new Error(
          "Save operation did not return expected file information.",
        );
      }
    } catch (error) {
      this.app.driveStatusMessage = `Save error: ${error.message || "Unknown error"}`;
    }
  }

  async handleLoadFromDriveClick() {
    this.app.showDriveMenu = false; // Close menu on action
    if (!this._checkDriveReadiness("load")) {
      return;
    }
    this.app.driveStatusMessage = "Opening Google Drive file picker...";
    this.app.googleDriveManager.showFilePicker(
      async (error, file) => {
        if (error) {
          this.app.driveStatusMessage = `File selection error: ${error.message || "Cancelled or failed."}`;
          return;
        }
        if (!file || !file.id) {
          this.app.driveStatusMessage =
            "File selection cancelled or no file chosen.";
          return;
        }
        this.app.driveStatusMessage = `Loading ${file.name} from Drive...`;
        try {
          // This relies on dataManager being set up on the app instance
          const parsedData = await this.app.dataManager.loadDataFromDrive(
            file.id,
          );
          if (parsedData) {
            // Update app's data properties directly
            this.app.character = parsedData.character;
            this.app.skills = parsedData.skills;
            this.app.specialSkills = parsedData.specialSkills;
            this.app.equipments = parsedData.equipments;
            this.app.histories = parsedData.histories;
            this.app.currentDriveFileId = file.id;
            this.app.currentDriveFileName = file.name;
            this.app.driveStatusMessage = `Loaded: ${this.app.currentDriveFileName} from Drive.`;
          } else {
            throw new Error("Load operation did not return data.");
          }
        } catch (err) {
          this.app.driveStatusMessage = `Load error for ${file.name || "file"}: ${err.message || "Unknown error"}`;
        }
      },
      this.app.driveFolderId || null,
      ["application/json"], // MIME types for filtering
    );
  }

  _checkDriveReadiness(actionContext = "operate") {
    if (!this.app.googleDriveManager) {
      this.app.driveStatusMessage = "Error: Drive Manager is not available.";
      return false;
    }
    if (!this.app.isSignedIn) {
      this.app.driveStatusMessage = `Error: Please sign in to ${actionContext}.`;
      return false;
    }
    return true;
  }
}
