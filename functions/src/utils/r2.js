import { S3Client } from '@aws-sdk/client-s3';
import { ensureEnv } from './env.js';

const clients = new Map();
const IMAGE_FOLDER = 'images';
const KEY_ALLOWED_PATTERN = /^[A-Za-z0-9@._|:/+\-]+$/;
const KEY_FORBIDDEN_PATTERN = /(?:\.\.)|\\/;
const MAX_KEY_LENGTH = 512;

export function getR2Client(env) {
  const accountId = ensureEnv(env.R2_ACCOUNT_ID, 'R2_ACCOUNT_ID');
  const accessKeyId = ensureEnv(env.R2_ACCESS_KEY_ID, 'R2_ACCESS_KEY_ID');
  const secretAccessKey = ensureEnv(env.R2_SECRET_ACCESS_KEY, 'R2_SECRET_ACCESS_KEY');
  const cacheKey = `${accountId}:${accessKeyId}`;

  if (!clients.has(cacheKey)) {
    clients.set(
      cacheKey,
      new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }),
    );
  }

  return clients.get(cacheKey);
}

export function getBucketName(env) {
  return ensureEnv(env.R2_BUCKET_NAME, 'R2_BUCKET_NAME');
}

export function buildCharacterKey(userId, characterId) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!characterId) {
    throw new Error('Character ID is required');
  }
  return `${userId}/${characterId}.json`;
}

export function generateImageKey(userId, extension = 'png') {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, '') || 'png';
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${userId}/${IMAGE_FOLDER}/${unique}.${safeExtension}`;
}

export function ensureImageOwnership(userId, key) {
  if (!userId || !key) {
    throw new Error('User ID and image key are required.');
  }

  assertValidImageKey(key);

  const prefix = `${userId}/${IMAGE_FOLDER}/`;
  if (!key.startsWith(prefix)) {
    throw new Error('You do not have permission to modify this image.');
  }
}

export function isValidImageKey(key) {
  if (typeof key !== 'string') {
    return false;
  }

  if (!key || key.length > MAX_KEY_LENGTH) {
    return false;
  }

  if (key.startsWith('/')) {
    return false;
  }

  if (key.includes('?') || key.includes('#')) {
    return false;
  }

  if (KEY_FORBIDDEN_PATTERN.test(key) || key.includes('//')) {
    return false;
  }

  return KEY_ALLOWED_PATTERN.test(key);
}

export function assertValidImageKey(key) {
  if (!isValidImageKey(key)) {
    throw new Error('Invalid image key.');
  }
}

export async function streamToUint8Array(stream) {
  if (!stream) {
    return new Uint8Array();
  }

  if (stream instanceof Uint8Array) {
    return stream;
  }

  if (typeof stream.arrayBuffer === 'function') {
    return new Uint8Array(await stream.arrayBuffer());
  }

  if (stream.getReader) {
    const reader = stream.getReader();
    const chunks = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
        chunks.push(chunk);
        totalLength += chunk.byteLength;
      }
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }

  if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
    const chunks = [];
    let totalLength = 0;
    for await (const value of stream) {
      if (!value) {
        continue;
      }
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
      chunks.push(chunk);
      totalLength += chunk.byteLength;
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }

  return new Uint8Array();
}

export async function streamToString(stream) {
  const buffer = await streamToUint8Array(stream);
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}
