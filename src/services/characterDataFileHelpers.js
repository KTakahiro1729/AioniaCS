import { deepClone } from '../utils/utils.js';

function extractImagesArray(character) {
  if (!character) {
    return [];
  }
  const images = Array.isArray(character.images)
    ? character.images.filter((image) => typeof image === 'string' && image.trim() !== '')
    : [];
  return images;
}

export function separateCharacterImages(character) {
  const clonedCharacter = deepClone(character || {});
  const images = extractImagesArray(clonedCharacter);

  if (images.length > 0) {
    delete clonedCharacter.images;
  }

  return { characterWithoutImages: clonedCharacter, images };
}

function getMimeTypeFromDataUrl(dataUrl) {
  const match = /^data:([^;]+);/i.exec(dataUrl || '');
  return match ? match[1] : 'image/png';
}

function getExtensionFromDataUrl(dataUrl) {
  const mime = getMimeTypeFromDataUrl(dataUrl);
  const slashIndex = mime.indexOf('/');
  if (slashIndex === -1) {
    return 'png';
  }
  const subtype = mime.substring(slashIndex + 1);
  if (subtype === 'jpeg') {
    return 'jpg';
  }
  return subtype || 'png';
}

export async function buildZipFromCharacterData(data, images) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  zip.file('character_data.json', jsonString);

  if (Array.isArray(images) && images.length > 0) {
    const imageFolder = zip.folder('images');
    images.forEach((imageDataUrl, index) => {
      if (typeof imageDataUrl !== 'string') {
        return;
      }
      const commaIndex = imageDataUrl.indexOf(',');
      const base64Data = commaIndex >= 0 ? imageDataUrl.substring(commaIndex + 1) : imageDataUrl;
      const extension = getExtensionFromDataUrl(imageDataUrl);
      imageFolder.file(`image_${index}.${extension || 'png'}`, base64Data, {
        base64: true,
      });
    });
  }

  return zip.generateAsync({ type: 'uint8array' });
}

function sortImageEntries(entries) {
  const regex = /image_(\d+)\..+/i;
  entries.sort((a, b) => {
    const matchA = a.relativePath.match(regex);
    const matchB = b.relativePath.match(regex);

    const numA = matchA ? parseInt(matchA[1], 10) : Infinity;
    const numB = matchB ? parseInt(matchB[1], 10) : Infinity;

    if (Number.isFinite(numA) && Number.isFinite(numB)) {
      return numA - numB;
    }
    if (Number.isFinite(numA)) {
      return -1;
    }
    if (Number.isFinite(numB)) {
      return 1;
    }
    return a.relativePath.localeCompare(b.relativePath);
  });
}

function ensureArrayBuffer(data) {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return data.arrayBuffer();
  }
  if (typeof data === 'string') {
    const buffer = new ArrayBuffer(data.length);
    const uint8View = new Uint8Array(buffer);
    for (let i = 0; i < data.length; i += 1) {
      uint8View[i] = data.charCodeAt(i) & 0xff;
    }
    return buffer;
  }
  throw new Error('Unsupported ZIP payload type.');
}

export async function parseCharacterZipData(data) {
  const buffer = await ensureArrayBuffer(data);
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const jsonDataFile = zip.file('character_data.json');

  if (!jsonDataFile) {
    throw new Error('ZIPファイルに character_data.json が見つかりません。');
  }

  const jsonContent = await jsonDataFile.async('string');
  const rawJsonData = JSON.parse(jsonContent);

  const imageEntries = [];
  const imageFolder = zip.folder('images');
  if (imageFolder) {
    const imagePromises = [];
    imageFolder.forEach((relativePath, fileEntry) => {
      if (!fileEntry.dir) {
        const promise = fileEntry
          .async('base64')
          .then((base64Data) => {
            const extension = relativePath.substring(relativePath.lastIndexOf('.') + 1) || 'png';
            const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
            imageEntries.push({
              relativePath,
              imageDataUrl: `data:${mimeType};base64,${base64Data}`,
            });
          })
          .catch((error) => {
            console.error(`Error loading image ${relativePath} from zip:`, error);
          });
        imagePromises.push(promise);
      }
    });
    await Promise.all(imagePromises);
    sortImageEntries(imageEntries);
  }

  if (!rawJsonData.character) {
    rawJsonData.character = {};
  }
  rawJsonData.character.images = imageEntries.map((item) => item.imageDataUrl);

  return rawJsonData;
}
