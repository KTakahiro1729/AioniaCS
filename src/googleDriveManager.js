/**
 * Manages interactions with Google Drive and Google Sign-In.
 */
class GoogleDriveManager {
  constructor(apiKey, clientId) {
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.discoveryDocs = [
      "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    ];
    this.scope =
      "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly";
    this.gapiLoadedCallback = null;
    this.gisLoadedCallback = null;
    this.tokenClient = null;
    this.pickerApiLoaded = false;

    // Bind methods
    this.handleSignIn = this.handleSignIn.bind(this);
    this.handleSignOut = this.handleSignOut.bind(this);
  }

  /**
   * Called when the Google API script (api.js) is loaded.
   * Initializes the GAPI client.
   * @returns {Promise<void>}
   */
  onGapiLoad() {
    return new Promise((resolve, reject) => {
      if (typeof gapi === "undefined" || !gapi.load) {
        const err = new Error("GAPI core script not available for gapi.load.");
        console.error("GDM: " + err.message);
        return reject(err);
      }
      gapi.load("client:picker", () => {
        if (typeof gapi.client === "undefined" || !gapi.client.init) {
          const err = new Error(
            "GAPI client script not available for gapi.client.init.",
          );
          console.error("GDM: " + err.message);
          return reject(err);
        }
        gapi.client
          .init({
            apiKey: this.apiKey,
            discoveryDocs: this.discoveryDocs,
            // scope: this.scope, // Scope is handled by GIS token client for Drive data access
          })
          .then(() => {
            this.pickerApiLoaded = true;
            console.log("GDM: GAPI client and Picker initialized.");
            resolve();
          })
          .catch((error) => {
            console.error("GDM: Error initializing GAPI client:", error);
            reject(error);
          });
      });
    });
  }

  /**
   * Called when the Google Identity Services (GIS) script is loaded.
   * Initializes the token client.
   * @returns {Promise<void>}
   */
  onGisLoad() {
    return new Promise((resolve, reject) => {
      if (
        typeof google === "undefined" ||
        !google.accounts ||
        !google.accounts.oauth2 ||
        !google.accounts.oauth2.initTokenClient
      ) {
        const err = new Error(
          "GIS library not fully available to initialize token client (google.accounts.oauth2.initTokenClient is undefined).",
        );
        console.error("GDM: " + err.message);
        return reject(err);
      }
      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: this.scope,
          callback: "", // Callback will be set dynamically per request for actual token requests
        });
        console.log("GDM: GIS Token Client initialized.");
        resolve();
      } catch (error) {
        console.error("GDM: Error initializing GIS Token Client:", error);
        reject(error);
      }
    });
  }

  /**
   * Initiates the Google Sign-In flow.
   * @param {function} callback - Called with the sign-in status/user profile or error.
   */
  handleSignIn(callback) {
    if (!this.tokenClient) {
      console.error("GIS Token Client not initialized.");
      if (callback) callback(new Error("GIS Token Client not initialized."));
      return;
    }

    // Set a dynamic callback for this specific sign-in attempt
    this.tokenClient.callback = (resp) => {
      if (resp.error) {
        console.error("Google Sign-In error:", resp.error);
        if (callback) callback(new Error(resp.error));
        return;
      }
      // GIS automatically manages token refresh.
      // No need to manually get user profile here, gapi.client will use the token.
      // The app can check gapi.auth.getToken() to see if it's signed in.
      console.log("Sign-in successful, token obtained.");
      if (callback) callback(null, { signedIn: true }); // Indicate success
    };

    // Prompt the user to select an account and grant access
    // Check if already has an access token
    if (gapi.client.getToken() === null) {
      this.tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      // Already has a token, consider as signed in
      this.tokenClient.requestAccessToken({ prompt: "" }); // Try to get token without prompt
    }
  }

  /**
   * Handles Google Sign-Out.
   * @param {function} callback - Called after sign-out.
   */
  handleSignOut(callback) {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token, () => {
        gapi.client.setToken(""); // Clear GAPI's token
        console.log("User signed out and token revoked.");
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }

  // --- Placeholder methods for Drive functionality ---

  /**
   * Creates a new folder in Google Drive.
   * @param {string} folderName - The name for the new folder.
   * @returns {Promise<string|null>} The ID of the created folder, or null on error.
   */
  async createFolder(folderName) {
    if (!gapi.client || !gapi.client.drive) {
      console.error("GAPI client or Drive API not loaded.");
      return null;
    }
    try {
      const response = await gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id, name",
      });
      console.log("Folder created successfully:", response.result);
      return response.result;
    } catch (error) {
      console.error("Error creating folder:", error);
      return null;
    }
  }

  /**
   * Finds a folder by name in Google Drive.
   * @param {string} folderName - The name of the folder to find.
   * @returns {Promise<string|null>} The ID of the folder if found, otherwise null.
   */
  async findFolder(folderName) {
    if (!gapi.client || !gapi.client.drive) {
      console.error("GAPI client or Drive API not loaded.");
      return null;
    }
    try {
      const response = await gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive",
      });
      const files = response.result.files;
      if (files && files.length > 0) {
        console.log("Folder found:", files[0]);
        return files[0];
      } else {
        console.log("Folder not found:", folderName);
        return null;
      }
    } catch (error) {
      console.error("Error finding folder:", error);
      return null;
    }
  }

  /**
   * Gets an existing folder's ID or creates it if it doesn't exist.
   * @param {string} appFolderName - The name of the folder.
   * @returns {Promise<string|null>} The folder ID, or null on error.
   */
  async getOrCreateAppFolder(appFolderName) {
    if (!gapi.client || !gapi.client.drive) {
      console.error(
        "GAPI client or Drive API not loaded for getOrCreateAppFolder.",
      );
      return null;
    }
    try {
      let folderId = await this.findFolder(appFolderName);
      if (!folderId) {
        console.log(`Folder "${appFolderName}" not found, creating it.`);
        folderId = await this.createFolder(appFolderName);
      }
      return folderId;
    } catch (error) {
      console.error(
        `Error in getOrCreateAppFolder for "${appFolderName}":`,
        error,
      );
      return null;
    }
  }

  /**
   * Lists files in a given folder with a specific MIME type.
   * @param {string} folderId - The ID of the folder to list files from.
   * @param {string} mimeType - The MIME type of files to list.
   * @returns {Promise<Array<{id: string, name: string}>>} A list of files, or empty array on error.
   */
  async listFiles(folderId, mimeType = "application/json") {
    if (!gapi.client || !gapi.client.drive) {
      console.error("GAPI client or Drive API not loaded for listFiles.");
      return [];
    }
    try {
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and mimeType='${mimeType}' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive",
      });
      return response.result.files || [];
    } catch (error) {
      console.error("Error listing files:", error);
      return [];
    }
  }

  /**
   * Saves a file (creates or updates) to Google Drive.
   * @param {string} folderId - The ID of the parent folder (used if creating a new file).
   * @param {string} fileName - The name of the file.
   * @param {string} fileContent - The content of the file (JSON string).
   * @param {string|null} fileId - The ID of the file to update, or null to create a new file.
   * @returns {Promise<{id: string, name: string}|null>} File ID and name, or null on error.
   */
  async saveFile(folderId, fileName, fileContent, fileId = null) {
    if (!gapi.client || !gapi.client.drive) {
      console.error("GAPI client or Drive API not loaded for saveFile.");
      return null;
    }

    if (fileId) {
      try {
        const boundary = "-------314159265358979323846";
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelim = `\r\n--${boundary}--`;
        const contentType = "application/json";
        const metadata = { name: fileName, mimeType: contentType };

        const multipartRequestBody =
          delimiter +
          "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${contentType}\r\n\r\n` +
          fileContent +
          closeDelim;

        const response = await gapi.client.request({
          path: `/upload/drive/v3/files/${fileId}`,
          method: "PATCH",
          params: { uploadType: "multipart" },
          headers: {
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        });
        console.log("File updated successfully:", response.result);
        return { id: response.result.id, name: response.result.name };
      } catch (error) {
        // 404エラーの場合、ファイルが存在しないと判断し、新規作成フローに進む
        if (error.status === 404) {
          console.error(
            "Error creating file: The parent folder was not found.",
            error,
          );
          // UI側でハンドリングできるよう、具体的なエラーをスローする
          throw new Error(
            "Parent folder not found. Please select a new folder.",
          );
        } else {
          // その他の作成エラー
          console.error("Error creating new file:", error);
          if (error.result && error.result.error) {
            console.error("Detailed error:", error.result.error.message);
          }
          return null;
        }
      }
    }

    try {
      const boundary = "-------314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;
      const contentType = "application/json";
      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: contentType,
      };

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${contentType}\r\n\r\n` +
        fileContent +
        closeDelim;

      const response = await gapi.client.request({
        path: "/upload/drive/v3/files",
        method: "POST",
        params: { uploadType: "multipart", fields: "id,name" },
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
        body: multipartRequestBody,
      });
      console.log("File created successfully:", response.result);
      return { id: response.result.id, name: response.result.name };
    } catch (error) {
      console.error("Error creating new file:", error);
      if (error.result && error.result.error) {
        console.error("Detailed error:", error.result.error.message);
      }
      return null;
    }
  }

  /**
   * Loads the content of a file from Google Drive.
   * @param {string} fileId - The ID of the file to load.
   * @returns {Promise<string|null>} The file content as a string, or null on error.
   */
  async loadFileContent(fileId) {
    if (!gapi.client || !gapi.client.drive) {
      console.error("GAPI client or Drive API not loaded for loadFileContent.");
      return null;
    }
    try {
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: "media",
      });
      // The response body for alt: 'media' is directly the content.
      // For JSON, it might already be parsed if GAPI client detects content type.
      // If it's a string, it's fine. If it's an object (parsed JSON), stringify it.
      if (typeof response.body === "object") {
        return JSON.stringify(response.body);
      }
      return response.body; // Should be string
    } catch (error) {
      console.error("Error loading file content:", error);
      if (error.result && error.result.error) {
        console.error("Detailed error:", error.result.error.message);
      }
      return null;
    }
  }

  /**
   * Shows the Google File Picker to select a file.
   * @param {function} callback - Function to call with the result (error, {id, name}).
   * @param {string|null} parentFolderId - Optional ID of the folder to start in.
   * @param {Array<string>} mimeTypes - Array of MIME types to filter by.
   */
  showFilePicker(
    callback,
    parentFolderId = null,
    mimeTypes = ["application/json"],
  ) {
    if (!this.pickerApiLoaded) {
      console.error("Picker API not loaded yet.");
      if (callback) callback(new Error("Picker API not loaded."));
      return;
    }

    const token = gapi.client.getToken();
    if (!token) {
      console.error("User not signed in or token not available for Picker.");
      if (callback) callback(new Error("Not signed in or token unavailable."));
      return;
    }

    const pickerCallback = (data) => {
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const doc = data[google.picker.Response.DOCUMENTS][0];
        if (callback) callback(null, { id: doc.id, name: doc.name });
      } else if (
        data[google.picker.Response.ACTION] === google.picker.Action.CANCEL
      ) {
        console.log("Picker cancelled by user.");
        if (callback) callback(new Error("Picker cancelled by user."));
      }
    };

    const view = new google.picker.View(google.picker.ViewId.DOCS);
    if (parentFolderId) {
      view.setParent(parentFolderId);
    }
    if (mimeTypes && mimeTypes.length > 0) {
      view.setMimeTypes(mimeTypes.join(","));
    }

    const pickerBuilder = new google.picker.PickerBuilder()
      .setOrigin(window.location.origin)
      .addView(view)
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .setOAuthToken(token.access_token)
      .setCallback(pickerCallback);

    const picker = pickerBuilder.build();
    picker.setVisible(true);
  }

  /**
   * Shows the Google Folder Picker to select a folder.
   * @param {function} callback - Function to call with the result (error, {id, name}).
   */
  /**
   * Shows the Google Folder Picker to select a folder.
   * @param {function} callback - Function to call with the result (error, {id, name}).
   */
  showFolderPicker(callback) {
    if (!this.pickerApiLoaded) {
      console.error("Picker API not loaded yet for folder picker.");
      if (callback) callback(new Error("Picker API not loaded."));
      return;
    }

    const token = gapi.client.getToken();
    if (!token) {
      console.error(
        "User not signed in or token not available for Folder Picker.",
      );
      if (callback) callback(new Error("Not signed in or token unavailable."));
      return;
    }

    const pickerCallback = (data) => {
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const folder = data[google.picker.Response.DOCUMENTS][0];
        if (callback) callback(null, { id: folder.id, name: folder.name });
      } else if (
        data[google.picker.Response.ACTION] === google.picker.Action.CANCEL
      ) {
        console.log("Folder Picker cancelled by user.");
        if (callback) callback(new Error("Folder Picker cancelled by user."));
      }
    };

    const view = new google.picker.DocsView();
    view.setIncludeFolders(true);
    view.setSelectFolderEnabled(true);
    view.setMimeTypes("application/vnd.google-apps.folder");

    const pickerBuilder = new google.picker.PickerBuilder()
      .setOrigin(window.location.origin)
      .addView(view)
      .setTitle("Select a folder")
      .setOAuthToken(token.access_token)
      .setCallback(pickerCallback);

    const picker = pickerBuilder.build();
    picker.setVisible(true);
  }
}

// Make the class available globally for now, to be instantiated in main.js
window.GoogleDriveManager = GoogleDriveManager;

// Global gapiLoaded and gisLoaded functions will be defined in main.js
// and will call the appropriate methods on the GoogleDriveManager instance.
