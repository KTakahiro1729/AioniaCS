import { DataManager } from '@/features/character-sheet/services/dataManager.js';
import { AioniaGameData } from '@/data/gameData.js';
import { deserializeCharacterPayload } from '@/shared/utils/characterSerialization.js';

const dataManager = new DataManager(AioniaGameData);

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reader.abort();
      reject(new Error('ファイルの読み込みに失敗しました'));
    };
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        const raw = await deserializeCharacterPayload(content);
        const parsedData = dataManager.parseLoadedData(raw);
        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };

    if (/\.zip$/i.test(file.name)) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export async function importCharacterFile(file) {
  const parsedData = await readFile(file);
  return { parsedData, file };
}
