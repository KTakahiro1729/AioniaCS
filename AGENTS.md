# AGENT Instructions

- When creating a pull request, include a Githack link so reviewers can preview the HTML after changes.
  Example:
  `https://raw.githack.com/KTakahiro1729/AioniaCS/<branch>/index.html`
  Replace `<branch>` with the branch name containing your changes. For example, `https://raw.githack.com/KTakahiro1729/AioniaCS/codex/add-slider/index.html`
- Use branch names that only contain ASCII characters (letters, numbers, hyphens, underscores).
- When creating designs, keep in mind that the theme is 'DarkFantasy'
- This repository is intended to work on Github Pages, meaning build tools and languages(such as TypeScript, Sass) cannot be used.

---

## Google Drive Integration

### Feature Overview

This feature allows users to save their Aionia Character Sheet data directly to their personal Google Drive and load it back into the application.

**Benefits**:
*   **Data Persistence**: Keep your character data safe and accessible across different devices or browser sessions.
*   **User Control**: Your character data is stored in your own Google Drive, under your control.
*   **Convenience**: Easily manage multiple character sheets and load them as needed.

### User Workflow

1.  **Signing In**:
    *   Click the "Sign In with Google" button located in the footer.
    *   A Google Sign-In window will appear. Choose your account and grant the necessary permissions.
    *   The application requests permission to access only files it creates or that you explicitly open with it.

2.  **Folder Setup**:
    *   **Automatic Setup**: On your first sign-in with the feature, the application will attempt to find or create a dedicated folder named `AioniaCS_Data` in your Google Drive. This folder will be used by default for saving your character sheets.
    *   **Manual Selection**: You can change the target folder at any time by clicking the "Choose Drive Folder" button. This will open a Google Drive folder picker.
    *   The ID and name of your chosen folder are saved in your browser's `localStorage` so you don't have to choose it every time.

3.  **Saving Data**:
    *   Click the "Save to Drive" button.
    *   If no folder is set, you'll be prompted to choose one first.
    *   The character sheet will be saved as a JSON file (e.g., `MyCharacter_AioniaSheet.json`) in the selected Drive folder. The filename is derived from your character's name.
    *   If you load a file from Drive and then save, it will update (overwrite) the same file you loaded, helping to avoid duplicates in most cases. If you wish to save as a new file after loading, you may need to clear the current file context (e.g., by refreshing or signing out/in, though a dedicated "Save As New" is not yet implemented).

4.  **Loading Data**:
    *   Click the "Load from Drive" button.
    *   A Google Picker will appear, allowing you to browse and select your character sheet JSON files from your Drive. It will typically start in your last selected folder.
    *   Select the desired character sheet file to load it into the application.

5.  **Signing Out**:
    *   Click the "Sign Out" button.
    *   This will revoke the application's access token for your Google account. You will need to sign in again to use the Google Drive features.
    *   Signing out also clears the currently active Drive file context from the application.

### For Developers (Self-Hosting/Modification)

The Google Drive integration uses the Google Drive API (v3) and Google Identity Services (GIS) for OAuth 2.0. If you are hosting a modified version of this application or developing it locally, you will need to configure your own Google Cloud Project credentials.

**Google Cloud Console Setup Steps**:

1.  **Create a Google Cloud Project**:
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.

2.  **Enable APIs**:
    *   Navigate to "APIs & Services" > "Library".
    *   Search for and enable the **Google Drive API**.

3.  **Configure OAuth Consent Screen**:
    *   Navigate to "APIs & Services" > "OAuth consent screen".
    *   Choose "External" for User Type if your app is public, or "Internal" if restricted to a Google Workspace organization.
    *   Fill in the application name, user support email, and developer contact information.
    *   **Scopes**: Add the following scopes:
        *   `https://www.googleapis.com/auth/drive.file` - Allows the app to create new files and access/modify files that the user opens with the app or that the app itself created.
        *   `https://www.googleapis.com/auth/drive.metadata.readonly` - Used by the Picker API for displaying file/folder information. (Note: The `drive.file` scope might cover some picker needs, but this ensures broader compatibility with picker features if folder metadata is accessed more generally).

4.  **Create OAuth 2.0 Client ID**:
    *   Navigate to "APIs & Services" > "Credentials".
    *   Click "+ CREATE CREDENTIALS" > "OAuth client ID".
    *   **Application type**: Select "Web application".
    *   **Name**: Give your OAuth client a descriptive name (e.g., "AioniaCS Web Client").
    *   **Authorized JavaScript origins**: Add the URI(s) where your application is hosted.
        *   Example for GitHub Pages: `https://your-username.github.io`
        *   Example for local development: `http://localhost:8000` (or your specific port)
    *   **Authorized redirect URIs**: For client-side JavaScript applications using Google Identity Services' token client, a redirect URI is not strictly used for the token flow in the same way as server-side flows. However, it's good practice to set this to your application's main URL.
        *   Example for GitHub Pages: `https://your-username.github.io/your-repo-name/`
        *   Example for local development: `http://localhost:8000`
    *   Click "CREATE". Copy the **Client ID**.

5.  **Create an API Key**:
    *   Navigate to "APIs & Services" > "Credentials".
    *   Click "+ CREATE CREDENTIALS" > "API key".
    *   Copy the **API Key**.
    *   **Restrict the API Key**: It is highly recommended to restrict your API key.
        *   Click on the newly created API key.
        *   Under "API restrictions", select "Restrict key" and choose "Google Drive API" from the dropdown.
        *   Under "Application restrictions", select "HTTP referrers (web sites)" and add the same URIs you used for Authorized JavaScript origins (e.g., `https://your-username.github.io/*`).

6.  **Update Application Code**:
    *   Open `src/main.js`.
    *   Locate the `data()` function within the Vue app definition.
    *   Update the `apiKey` and `clientId` properties with the credentials you obtained:
        ```javascript
        // ...
        data() {
            return {
                // ...
                apiKey: 'YOUR_ACTUAL_API_KEY',
                clientId: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
                // ...
            };
        },
        // ...
        ```

### Data Storage Notes

*   Character sheets are stored as JSON (`.json`) files in your Google Drive.
*   The application adheres to the principle of least privilege. With the `drive.file` scope, it can only access:
    *   Files it creates in your Drive.
    *   Files you explicitly open using the Google Picker within the application.
    It does **not** have general access to all files and folders in your Google Drive.
*   For your convenience, the ID and name of the Google Drive folder you last selected (or the default `AioniaCS_Data` folder) are stored in your browser's `localStorage`. This allows the application to remember your preferred folder across sessions. Clearing your browser's site data will remove this stored preference.
