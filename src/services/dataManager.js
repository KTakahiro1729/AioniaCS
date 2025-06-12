import { createWeaknessArray, deepClone } from "../utils/utils.js";
import JSZip from "jszip";
import { useNotificationStore } from "../stores/notificationStore.js";

/**
 * データ管理系の機能を担当するクラス
 */
export class DataManager {
  constructor(gameData) {
    this.gameData = gameData;
    this.googleDriveManager = null;
  }

  /**
   * Sets the GoogleDriveManager instance.
   * @param {GoogleDriveManager} driveManager - The GoogleDriveManager instance.
   */
  setGoogleDriveManager(driveManager) {
    this.googleDriveManager = driveManager;
  }

  _sanitizeFileName(name) {
    const sanitized = (name || "").replace(/[\\/:*?"<>|]/g, "_").trim();
    return sanitized || "Aionia_Character";
  }

  _sanitizeFileName(name) {
    const sanitized = (name || "").replace(/[\\/:*?"<>|]/g, "_").trim();
    return sanitized || "Aionia_Character";
  }

  /**
   * キャラクターデータを保存
   */
  async saveData(character, skills, specialSkills, equipments, histories) {
    const characterDataForJson = { ...character };
    let imagesToSave = null;

    if (characterDataForJson.images && characterDataForJson.images.length > 0) {
      imagesToSave = [...characterDataForJson.images]; // Store images separately
      delete characterDataForJson.images; // Remove images from JSON part
    }

    const dataToSave = {
      character: characterDataForJson,
      skills: skills.map((s) => ({
        id: s.id,
        checked: s.checked,
        canHaveExperts: s.canHaveExperts,
        experts: s.canHaveExperts
          ? s.experts
              .filter((e) => e.value && e.value.trim() !== "")
              .map((e) => ({ value: e.value }))
          : [],
      })),
      specialSkills: specialSkills.filter((ss) => ss.group && ss.name),
      equipments: equipments,
      histories: histories.filter(
        (h) =>
          h.sessionName ||
          (h.gotExperiments !== null && h.gotExperiments !== "") ||
          h.memo,
      ),
    };

    const jsonData = JSON.stringify(dataToSave, null, 2);
    const charName = this._sanitizeFileName(character.name);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

    if (imagesToSave) {
      // Save as ZIP
      try {
        const zip = new JSZip();
        zip.file("character_data.json", jsonData);
        const imageFolder = zip.folder("images");

        imagesToSave.forEach((imageDataUrl, index) => {
          const base64Data = imageDataUrl.substring(
            imageDataUrl.indexOf(",") + 1,
          );
          // Simple extension, could be improved by parsing imageDataUrl
          const extension = imageDataUrl.substring(
            imageDataUrl.indexOf("/") + 1,
            imageDataUrl.indexOf(";"),
          );
          imageFolder.file(`image_${index}.${extension || "png"}`, base64Data, {
            base64: true,
          });
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${charName}_${timestamp}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error saving ZIP file:", error);
        useNotificationStore().addToast({
          type: "error",
          message: `ZIPファイルの保存に失敗しました: ${error.message}`,
        });
      }
    } else {
      // Save as JSON (original behavior)
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${charName}_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * ファイルアップロードを処理
   */
  handleFileUpload(event, onSuccess, onError) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name;
    const reader = new FileReader();

    if (fileName.endsWith(".zip")) {
      reader.onload = async (e) => {
        try {
          const zip = await JSZip.loadAsync(e.target.result);
          const jsonDataFile = zip.file("character_data.json");

          if (!jsonDataFile) {
            throw new Error(
              "ZIPファイルに character_data.json が見つかりません。",
            );
          }

          const jsonContent = await jsonDataFile.async("string");
          const rawJsonData = JSON.parse(jsonContent);

          const imageFilesData = []; // Intermediate array for image data and paths
          const imageFolder = zip.folder("images");
          if (imageFolder) {
            const imagePromises = [];
            imageFolder.forEach((relativePath, fileEntry) => {
              if (!fileEntry.dir) {
                // Ensure it's a file
                const promise = fileEntry
                  .async("base64")
                  .then((base64Data) => {
                    const extension =
                      relativePath.substring(
                        relativePath.lastIndexOf(".") + 1,
                      ) || "png";
                    const mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`;
                    // Push an object with relativePath and imageDataUrl
                    imageFilesData.push({
                      relativePath: relativePath,
                      imageDataUrl: `data:${mimeType};base64,${base64Data}`,
                    });
                  })
                  .catch((imgError) => {
                    console.error(
                      `Error loading image ${relativePath} from zip:`,
                      imgError,
                    );
                    // Optionally skip this image or handle error by not pushing to imageFilesData
                  });
                imagePromises.push(promise);
              }
            });
            await Promise.all(imagePromises); // Wait for all images to be processed

            // Sort imageFilesData based on relativePath
            imageFilesData.sort((a, b) => {
              const regex = /image_(\d+)\..+/i;
              const matchA = a.relativePath.match(regex);
              const matchB = b.relativePath.match(regex);

              const numA = matchA ? parseInt(matchA[1], 10) : Infinity;
              const numB = matchB ? parseInt(matchB[1], 10) : Infinity;

              if (numA !== Infinity && numB !== Infinity) {
                return numA - numB;
              } else if (numA !== Infinity) {
                return -1; // A has a number, B doesn't, so A comes first
              } else if (numB !== Infinity) {
                return 1; // B has a number, A doesn't, so B comes first
              }
              // Neither has a valid number pattern, sort by full path as a fallback
              return a.relativePath.localeCompare(b.relativePath);
            });
          }

          // Ensure character object exists before assigning images
          if (!rawJsonData.character) {
            rawJsonData.character = {};
          }
          // Assign sorted images (only imageDataUrl part)
          rawJsonData.character.images = imageFilesData.map(
            (item) => item.imageDataUrl,
          );

          const parsedData = this.parseLoadedData(rawJsonData);
          onSuccess(parsedData);
        } catch (error) {
          console.error("Failed to parse ZIP file:", error);
          onError(
            this.gameData.uiMessages.fileLoadError +
              " (ZIP: " +
              error.message +
              ")",
          );
        }
      };
      reader.readAsArrayBuffer(file); // Read ZIP as ArrayBuffer
    } else {
      // Assume JSON or other text file
      reader.onload = (e) => {
        const fileContent = e.target.result;
        try {
          const rawJsonData = JSON.parse(fileContent);
          const parsedData = this.parseLoadedData(rawJsonData);
          onSuccess(parsedData);
        } catch (error) {
          console.error("Failed to parse JSON file:", error);
          onError(this.gameData.uiMessages.fileLoadError);
        }
      };
      reader.readAsText(file);
    }
    event.target.value = null;
  }

  /**
   * Saves character data to Google Drive.
   * @param {object} character - The character data.
   * @param {Array} skills - The skills data.
   * @param {Array} specialSkills - The special skills data.
   * @param {object} equipments - The equipment data.
   * @param {Array} histories - The histories data.
   * @param {string} targetFolderId - The ID of the folder to save to.
   * @param {string|null} currentFileId - The ID of the file if it exists (for updating).
   * @param {string} fileName - The desired name for the file.
   * @returns {Promise<object|null>} Result from GoogleDriveManager.saveFile or null on error.
   */
  async saveDataToDrive(
    character,
    skills,
    specialSkills,
    equipments,
    histories,
    targetFolderId,
    currentFileId,
    fileName,
  ) {
    if (!this.googleDriveManager) {
      console.error("GoogleDriveManager not set in DataManager.");
      throw new Error(
        "GoogleDriveManager not configured. Please sign in or initialize the Drive manager.",
      );
    }

    const dataToSave = {
      character: character,
      skills: skills.map((s) => ({
        id: s.id,
        checked: s.checked,
        canHaveExperts: s.canHaveExperts,
        experts: s.canHaveExperts
          ? s.experts
              .filter((e) => e.value && e.value.trim() !== "")
              .map((e) => ({ value: e.value }))
          : [],
      })),
      specialSkills: specialSkills.filter((ss) => ss.group && ss.name),
      equipments: equipments,
      histories: histories.filter(
        (h) =>
          h.sessionName ||
          (h.gotExperiments !== null && h.gotExperiments !== "") ||
          h.memo,
      ),
    };

    const jsonData = JSON.stringify(dataToSave, null, 2);
    const sanitizedFileName =
      (fileName || character.name || "Aionia_Character_Sheet").replace(
        /[\\/:*?"<>|]/g,
        "_",
      ) + ".json";

    try {
      const result = await this.googleDriveManager.saveFile(
        targetFolderId,
        sanitizedFileName,
        jsonData,
        currentFileId,
      );
      return result;
    } catch (error) {
      console.error("Error saving data to Google Drive:", error);
      throw error; // Re-throw to be caught by the caller UI
    }
  }

  /**
   * Loads data from a file in Google Drive.
   * @param {string} fileId - The ID of the file to load.
   * @returns {Promise<object|null>} Parsed character data or null on error.
   */
  async loadDataFromDrive(fileId) {
    if (!this.googleDriveManager) {
      console.error("GoogleDriveManager not set in DataManager.");
      throw new Error(
        "GoogleDriveManager not configured. Please sign in or initialize the Drive manager.",
      );
    }

    try {
      const fileContent = await this.googleDriveManager.loadFileContent(fileId);
      if (fileContent) {
        const rawJsonData = JSON.parse(fileContent);
        const parsedData = this.parseLoadedData(rawJsonData);
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error("Error loading data from Google Drive:", error);
      // Check if it's a parsing error from JSON.parse or from parseLoadedData
      if (error instanceof SyntaxError) {
        throw new Error(this.gameData.uiMessages.fileLoadError);
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * 外部JSONフォーマットを内部フォーマットに変換
   */
  convertExternalJsonToInternalFormat(externalData) {
    const internalData = {
      character: {
        name: externalData.name || "",
        playerName: externalData.player || "",
        species: externalData.species || "",
        rareSpecies: externalData.rare_species || "",
        occupation: externalData.occupation || "",
        age: externalData.age ? parseInt(externalData.age, 10) : null,
        gender: externalData.gender || "",
        height: externalData.height || "",
        weight: externalData.weight || "",
        origin: externalData.origin || "",
        faith: externalData.faith || "",
        otherItems: externalData.otherItems || "",
        initialScar: externalData.init_scar
          ? parseInt(externalData.init_scar, 10)
          : 0,
        currentScar: externalData.init_scar
          ? parseInt(externalData.init_scar, 10)
          : 0,
        linkCurrentToInitialScar:
          typeof externalData.linkCurrentToInitialScar === "boolean"
            ? externalData.linkCurrentToInitialScar
            : true,
        memo: externalData.character_memo || "",
        images: [], // Initialize images for external format
        weaknesses: createWeaknessArray(this.gameData.config.maxWeaknesses),
      },
      skills: [],
      specialSkills: [],
      equipments: {
        weapon1: { group: "", name: "" },
        weapon2: { group: "", name: "" },
        armor: { group: "", name: "" },
      },
      histories: [],
    };

    // 弱点データの変換
    if (externalData.init_weakness1) {
      internalData.character.weaknesses[0] = {
        text: externalData.init_weakness1,
        acquired: "作成時",
      };
    }
    if (externalData.init_weakness2) {
      internalData.character.weaknesses[1] = {
        text: externalData.init_weakness2,
        acquired: "作成時",
      };
    }

    // スキルデータの変換
    this._convertSkillsData(externalData, internalData);

    // 特技データの変換
    this._convertSpecialSkillsData(externalData, internalData);

    // 装備データの変換
    this._convertEquipmentData(externalData, internalData);

    // 履歴データの変換
    this._convertHistoryData(externalData, internalData);

    return internalData;
  }

  /**
   * 読み込まれたデータを解析
   */
  parseLoadedData(rawJsonData) {
    let dataToParse = rawJsonData;

    // フォーマット判定と変換
    if (this._isExternalFormat(rawJsonData)) {
      console.log(
        "External JSON format (bright-trpg tool) detected, converting...",
      );
      dataToParse = this.convertExternalJsonToInternalFormat(rawJsonData);
    } else if (this._isInternalFormat(rawJsonData)) {
      console.log("Internal JSON format (this tool) detected.");
      // If it's internal format but images are somehow missing in character, ensure it's there
      if (
        dataToParse.character &&
        typeof dataToParse.character.images === "undefined"
      ) {
        dataToParse.character.images = [];
      }
    } else {
      console.warn(
        "Unknown JSON format, attempting to parse as is. Data integrity not guaranteed.",
      );
      // Refined logic for unknown format
      let characterImages = []; // Default
      if (
        rawJsonData &&
        rawJsonData.character &&
        Array.isArray(rawJsonData.character.images)
      ) {
        characterImages = rawJsonData.character.images;
      } else if (
        rawJsonData &&
        rawJsonData.character &&
        typeof rawJsonData.character.images !== "undefined"
      ) {
        // It exists but is not an array, log warning or ignore, still use default empty array
        console.warn(
          "Loaded character data has an 'images' property that is not an array. Defaulting to empty images array.",
        );
      }

      dataToParse = {
        // Ensure default structure for character if not present in rawJsonData
        character: {
          images: characterImages,
          ...(rawJsonData.character || {}),
        },
        skills: [],
        specialSkills: [],
        equipments: {},
        histories: [],
        ...rawJsonData, // Spread rawJsonData, but character.images is now handled more carefully
      };
      // Now, ensure character.images is an array after all spreads
      if (!dataToParse.character) {
        // If rawJsonData completely overwrote character
        dataToParse.character = { images: [] };
      } else if (!Array.isArray(dataToParse.character.images)) {
        dataToParse.character.images = [];
      }
    }
    return this._normalizeLoadedData(dataToParse);
  }

  // プライベートメソッド
  _isExternalFormat(data) {
    return (
      data &&
      typeof data.player !== "undefined" && // bright-trpg tool has 'player'
      typeof data.character_memo !== "undefined"
    ); // and 'character_memo'
  }

  _isInternalFormat(data) {
    return (
      data &&
      data.character && // This tool has a nested 'character' object
      typeof data.character.playerName !== "undefined"
    ); // and 'playerName' inside 'character'
  }

  _convertSkillsData(externalData, internalData) {
    if (externalData.skills && Array.isArray(externalData.skills)) {
      this.gameData.externalSkillOrder.forEach((skillId, index) => {
        const appSkillDefinition = this.gameData.baseSkills.find(
          (s) => s.id === skillId,
        );
        if (appSkillDefinition && externalData.skills[index]) {
          const externalSkill = externalData.skills[index];
          const newSkill = {
            id: appSkillDefinition.id,
            name: appSkillDefinition.name,
            checked: !!externalSkill.selected,
            canHaveExperts: appSkillDefinition.canHaveExperts,
            experts: [],
          };

          if (newSkill.checked && newSkill.canHaveExperts) {
            if (
              externalSkill.expert_skills &&
              externalSkill.expert_skills.length > 0
            ) {
              newSkill.experts = externalSkill.expert_skills
                .map((es) => ({ value: es || "" }))
                .filter((e) => e.value);
            }
            if (newSkill.experts.length === 0) {
              newSkill.experts.push({ value: "" });
            }
          } else if (newSkill.canHaveExperts) {
            newSkill.experts.push({ value: "" });
          }

          internalData.skills.push(newSkill);
        } else if (appSkillDefinition) {
          // If external data is missing a skill, use default from app definition
          internalData.skills.push(deepClone(appSkillDefinition));
        }
      });
    } else {
      // No skills in external data, use default app skills
      internalData.skills = deepClone(this.gameData.baseSkills);
    }
  }

  _convertSpecialSkillsData(externalData, internalData) {
    if (
      externalData.special_skills &&
      Array.isArray(externalData.special_skills)
    ) {
      internalData.specialSkills = externalData.special_skills
        .filter((ss) => ss.group && ss.name) // Ensure basic validity
        .map((ss) => ({
          group: ss.group || "",
          name: ss.name || "",
          note: ss.note || "",
          showNote: this.gameData.specialSkillsRequiringNote.includes(
            ss.name || "",
          ),
        }));
    }
    // If no special skills, it will remain an empty array from initialization
  }

  _convertEquipmentData(externalData, internalData) {
    // Initialize with defaults, then override if data exists
    internalData.equipments = {
      weapon1: { group: "", name: "" },
      weapon2: { group: "", name: "" },
      armor: { group: "", name: "" },
    };
    if (externalData.weapon1_type || externalData.weapon1_name) {
      internalData.equipments.weapon1 = {
        group: externalData.weapon1_type || "",
        name: externalData.weapon1_name || "",
      };
    }
    if (externalData.weapon2_type || externalData.weapon2_name) {
      internalData.equipments.weapon2 = {
        group: externalData.weapon2_type || "",
        name: externalData.weapon2_name || "",
      };
    }
    if (externalData.armor_type || externalData.armor_name) {
      internalData.equipments.armor = {
        group: externalData.armor_type || "",
        name: externalData.armor_name || "",
      };
    }
  }

  _convertHistoryData(externalData, internalData) {
    if (externalData.history && Array.isArray(externalData.history)) {
      internalData.histories = externalData.history.map((h) => ({
        sessionName: h.name || "",
        gotExperiments: h.experiments ? parseInt(h.experiments, 10) : null,
        // Use 'memo' if present (from this tool's older format), otherwise 'stress' (from bright-trpg)
        memo: h.memo || h.stress || "",
      }));
    }
    // If no history, it will remain an empty array from initialization
  }

  _normalizeLoadedData(dataToParse) {
    // キャラクターデータの正規化
    const defaultCharacter = {
      ...this.gameData.defaultCharacterData, // This now includes images: []
      weaknesses: createWeaknessArray(this.gameData.config.maxWeaknesses),
    };

    // Ensure character.images exists if it's somehow missing from dataToParse.character
    // but character itself exists.
    const characterData = {
      ...defaultCharacter,
      ...(dataToParse.character || {}),
    };
    if (!Array.isArray(characterData.images)) {
      characterData.images = [];
    }

    const normalizedData = {
      character: characterData,
      skills: this._normalizeSkillsData(dataToParse.skills),
      specialSkills: this._normalizeSpecialSkillsData(
        dataToParse.specialSkills,
      ),
      equipments: this._normalizeEquipmentData(dataToParse.equipments),
      histories: this._normalizeHistoryData(dataToParse.histories),
    };

    // Ensure linkCurrentToInitialScar has a default if missing
    if (
      typeof normalizedData.character.linkCurrentToInitialScar === "undefined"
    ) {
      normalizedData.character.linkCurrentToInitialScar = true;
    }

    return normalizedData;
  }

  _normalizeSkillsData(skillsData) {
    const baseSkills = deepClone(this.gameData.baseSkills);

    if (skillsData && Array.isArray(skillsData)) {
      const loadedSkillsById = new Map(skillsData.map((s) => [s.id, s]));

      return baseSkills.map((appSkill) => {
        const loadedSkillData = loadedSkillsById.get(appSkill.id);
        if (loadedSkillData) {
          appSkill.checked = !!loadedSkillData.checked;
          if (appSkill.canHaveExperts) {
            // Ensure experts is an array, even if empty or null from loaded data
            appSkill.experts =
              loadedSkillData.experts && loadedSkillData.experts.length > 0
                ? loadedSkillData.experts.map((e) => ({ value: e.value || "" }))
                : [{ value: "" }]; // Default to one empty expert if checked
            // If all experts are empty strings, reduce to one
            if (
              appSkill.experts.length > 1 &&
              appSkill.experts.every((e) => e.value === "")
            ) {
              appSkill.experts = [{ value: "" }];
            }
          } else {
            appSkill.experts = []; // No experts if skill cannot have them
          }
        } else {
          // Skill not in loaded data, use default (experts already set by deepClone)
          if (appSkill.canHaveExperts) {
            appSkill.experts = [{ value: "" }];
          } else {
            appSkill.experts = [];
          }
        }
        return appSkill;
      });
    }
    // No skillsData, return baseSkills (already deepCloned with default expert structures)
    return baseSkills;
  }

  _normalizeSpecialSkillsData(specialSkillsData) {
    let loadedSSCount = 0;
    if (specialSkillsData && Array.isArray(specialSkillsData)) {
      loadedSSCount = specialSkillsData.length;
    }

    // Determine the target length for the special skills array
    const targetLength = Math.min(
      Math.max(this.gameData.config.initialSpecialSkillCount, loadedSSCount),
      this.gameData.config.maxSpecialSkills,
    );

    const normalizedSpecialSkills = [];
    for (let i = 0; i < targetLength; i++) {
      if (specialSkillsData && i < specialSkillsData.length) {
        const loadedSS = specialSkillsData[i];
        normalizedSpecialSkills.push({
          group: loadedSS.group || "",
          name: loadedSS.name || "",
          note: loadedSS.note || "",
          showNote: this.gameData.specialSkillsRequiringNote.includes(
            loadedSS.name || "",
          ),
        });
      } else {
        // Fill with empty special skill objects if loaded data is shorter
        normalizedSpecialSkills.push({
          group: "",
          name: "",
          note: "",
          showNote: false,
        });
      }
    }
    // If specialSkillsData was empty or null, this loop results in an array of empty skills
    // up to initialSpecialSkillCount (or max if initial is > max, though unlikely)
    return normalizedSpecialSkills;
  }

  _normalizeEquipmentData(equipmentData) {
    // Start with default empty equipment structure
    const defaultEquipments = {
      weapon1: { group: "", name: "" },
      weapon2: { group: "", name: "" },
      armor: { group: "", name: "" },
    };

    if (equipmentData) {
      // Merge loaded data into defaults, ensuring all keys exist
      return {
        weapon1: {
          ...defaultEquipments.weapon1,
          ...(equipmentData.weapon1 || {}),
        },
        weapon2: {
          ...defaultEquipments.weapon2,
          ...(equipmentData.weapon2 || {}),
        },
        armor: { ...defaultEquipments.armor, ...(equipmentData.armor || {}) },
      };
    }
    // No equipmentData, return defaults
    return defaultEquipments;
  }

  _normalizeHistoryData(historyData) {
    if (historyData && historyData.length > 0) {
      return historyData.map((h) => ({
        sessionName: h.sessionName || "",
        gotExperiments:
          h.gotExperiments === null ||
          h.gotExperiments === undefined ||
          h.gotExperiments === ""
            ? null // Keep null as null
            : Number(h.gotExperiments), // Convert valid numbers
        memo: h.memo || "",
      }));
    }
    // No historyData or empty array, return a single default history item
    return [{ sessionName: "", gotExperiments: null, memo: "" }];
  }
}

// グローバルに公開
window.DataManager = DataManager;
