import { deepClone } from './utils.js';

function filterSkills(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }
  return skills.map((skill) => ({
    id: skill.id,
    checked: Boolean(skill.checked),
    canHaveExperts: Boolean(skill.canHaveExperts),
    experts: skill.canHaveExperts
      ? (skill.experts || []).filter((expert) => expert.value && expert.value.trim() !== '').map((expert) => ({ value: expert.value }))
      : [],
  }));
}

function filterSpecialSkills(specialSkills) {
  if (!Array.isArray(specialSkills)) {
    return [];
  }
  return specialSkills.filter((ss) => ss.group && ss.name);
}

function filterHistories(histories) {
  if (!Array.isArray(histories)) {
    return [];
  }
  return histories.filter(
    (history) =>
      history.sessionName ||
      (history.gotExperiments !== null && history.gotExperiments !== '') ||
      (history.increasedScar !== null && history.increasedScar !== undefined) ||
      history.memo,
  );
}

export function serializeCharacterForExport({ character, skills, specialSkills, equipments, histories, includeImages = true }) {
  const characterClone = deepClone(character || {});
  let images = [];

  if (!includeImages) {
    delete characterClone.images;
  } else if (Array.isArray(characterClone.images) && characterClone.images.length > 0) {
    images = characterClone.images.slice();
    delete characterClone.images;
  }

  const payload = {
    character: characterClone,
    skills: filterSkills(skills),
    specialSkills: filterSpecialSkills(specialSkills),
    equipments: deepClone(equipments || {}),
    histories: filterHistories(histories),
  };

  return { data: payload, images };
}

function toTimestampString(date) {
  const target = date instanceof Date ? date : new Date(date);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  const hours = String(target.getHours()).padStart(2, '0');
  const minutes = String(target.getMinutes()).padStart(2, '0');
  const seconds = String(target.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function deriveImageExtension(imageDataUrl, index) {
  if (typeof imageDataUrl !== 'string') {
    return `image_${index}.png`;
  }
  const match = imageDataUrl.match(/^data:image\/(.+?);/i);
  const ext = match ? match[1].toLowerCase() : 'png';
  const normalized = ext === 'jpg' ? 'jpeg' : ext;
  return `image_${index}.${normalized || 'png'}`;
}

export async function buildCharacterArchive({ data, images = [] }) {
  const jsonString = JSON.stringify(data, null, 2);
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file('character_data.json', jsonString);

  if (Array.isArray(images) && images.length > 0) {
    const imageFolder = zip.folder('images');
    images.forEach((imageDataUrl, index) => {
      const fileName = deriveImageExtension(imageDataUrl, index);
      const base64Data = typeof imageDataUrl === 'string' ? imageDataUrl.substring(imageDataUrl.indexOf(',') + 1) : '';
      imageFolder.file(fileName, base64Data, { base64: true });
    });
  }

  const archive = await zip.generateAsync({ type: 'uint8array' });
  return {
    content: archive,
    mimeType: 'application/zip',
  };
}

function isLikelyBase64(str) {
  return /^[A-Za-z0-9+/=\r\n]+$/.test(str);
}

function base64ToUint8Array(base64) {
  const normalized = base64.replace(/\s+/g, '');
  const binary = atob(normalized);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToUint8Array(str) {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i += 1) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}

async function extractImagesFromZip(zip) {
  const imageFolder = zip.folder('images');
  if (!imageFolder) {
    return [];
  }

  const imageData = [];
  const tasks = [];

  imageFolder.forEach((relativePath, fileEntry) => {
    if (fileEntry.dir) {
      return;
    }
    const task = fileEntry
      .async('base64')
      .then((base64) => {
        const extension = relativePath.substring(relativePath.lastIndexOf('.') + 1) || 'png';
        const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        imageData.push({
          path: relativePath,
          dataUrl: `data:${mimeType};base64,${base64}`,
        });
      })
      .catch((error) => {
        console.error(`Failed to extract image ${relativePath} from archive:`, error);
      });
    tasks.push(task);
  });

  await Promise.all(tasks);

  imageData.sort((a, b) => {
    const regex = /image_(\d+)\./i;
    const matchA = a.path.match(regex);
    const matchB = b.path.match(regex);
    const indexA = matchA ? parseInt(matchA[1], 10) : Number.MAX_SAFE_INTEGER;
    const indexB = matchB ? parseInt(matchB[1], 10) : Number.MAX_SAFE_INTEGER;
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.path.localeCompare(b.path);
  });

  return imageData.map((entry) => entry.dataUrl);
}

export async function deserializeCharacterPayload(content) {
  if (content == null) {
    throw new Error('No content to deserialize');
  }

  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (jsonError) {
      try {
        const bytes = isLikelyBase64(content) ? base64ToUint8Array(content) : stringToUint8Array(content);
        return deserializeCharacterPayload(bytes);
      } catch {
        throw jsonError;
      }
    }
  }

  if (content instanceof ArrayBuffer) {
    return deserializeCharacterPayload(new Uint8Array(content));
  }

  if (ArrayBuffer.isView(content)) {
    const view = content instanceof Uint8Array ? content : new Uint8Array(content.buffer);
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(view);
    const jsonFile = zip.file('character_data.json');
    if (!jsonFile) {
      throw new Error('character_data.json がアーカイブ内に見つかりません');
    }

    const jsonContent = await jsonFile.async('string');
    const parsed = JSON.parse(jsonContent);
    if (!parsed.character) {
      parsed.character = {};
    }
    const images = await extractImagesFromZip(zip);
    if (images.length > 0) {
      parsed.character.images = images;
    } else if (!Array.isArray(parsed.character.images)) {
      parsed.character.images = [];
    }
    return parsed;
  }

  throw new Error('Unsupported content type for deserialization');
}

export { toTimestampString };
