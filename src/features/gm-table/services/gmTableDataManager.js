import { DataManager } from '@/features/character-sheet/services/dataManager.js';
import { AioniaGameData } from '@/data/gameData.js';
import { serializeCharacterForExport } from '@/shared/utils/characterSerialization.js';

const VERSION = 1;
const dataManager = new DataManager(AioniaGameData);

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePayloadCharacter(entry) {
  const payload = entry?.payload;
  if (!payload?.data) {
    return null;
  }
  const raw = {
    ...payload.data,
  };
  raw.character = {
    ...(payload.data?.character || {}),
    images: ensureArray(payload.images),
  };
  const parsedData = dataManager.parseLoadedData(raw);
  return {
    id: entry.id,
    memo: entry.memo || '',
    data: parsedData,
  };
}

function buildCharacterPayload(character) {
  const { data, images } = serializeCharacterForExport({
    character: character.data.character,
    skills: character.data.skills,
    specialSkills: character.data.specialSkills,
    equipments: character.data.equipments,
    histories: character.data.histories,
    includeImages: true,
  });
  return {
    id: character.id,
    memo: character.memo,
    sourceFileName: character.sourceFileName || null,
    payload: { data, images },
  };
}

export function buildGmTableExport(snapshot) {
  return {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    characters: ensureArray(snapshot?.characters).map((character) => buildCharacterPayload(character)),
    rowState: snapshot?.rowState || {},
    sessionMemo: snapshot?.sessionMemo || {},
  };
}

export function createGmTableBlob(snapshot, fileName = 'gm-table.json') {
  const exportObject = buildGmTableExport(snapshot);
  const content = JSON.stringify(exportObject, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reader.abort();
      reject(new Error('ファイルの読み込みに失敗しました'));
    };
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const json = JSON.parse(content);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
}

export async function parseGmTableFile(file) {
  const json = await readJsonFile(file);
  if (json?.version !== VERSION) {
    throw new Error('未対応のデータ形式です');
  }
  return {
    rowState: json.rowState || {},
    sessionMemo: json.sessionMemo || {},
    characters: ensureArray(json.characters)
      .map((entry) => normalizePayloadCharacter(entry))
      .filter((entry) => entry !== null),
  };
}
