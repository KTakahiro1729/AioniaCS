import { S3Client } from '@aws-sdk/client-s3';

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL } = process.env;

let client;

function ensureEnv(value, name) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getR2Client() {
  if (!client) {
    const accountId = ensureEnv(R2_ACCOUNT_ID, 'R2_ACCOUNT_ID');
    const accessKeyId = ensureEnv(R2_ACCESS_KEY_ID, 'R2_ACCESS_KEY_ID');
    const secretAccessKey = ensureEnv(R2_SECRET_ACCESS_KEY, 'R2_SECRET_ACCESS_KEY');

    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return client;
}

export function getBucketName() {
  return ensureEnv(R2_BUCKET_NAME, 'R2_BUCKET_NAME');
}

export function buildCharacterKey(userId, characterId) {
  if (!characterId) {
    throw new Error('Character ID is required');
  }
  return `${userId}/${characterId}.json`;
}

export function buildCharacterImagePrefix(userId, imageFolderId) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!imageFolderId) {
    throw new Error('Image folder ID is required');
  }
  return `${userId}/images/${imageFolderId}/`;
}

export function buildCharacterImageKey(userId, imageFolderId, fileName) {
  if (!fileName) {
    throw new Error('Image file name is required');
  }
  return `${buildCharacterImagePrefix(userId, imageFolderId)}${fileName}`;
}

export function getPublicBaseUrl() {
  return ensureEnv(R2_PUBLIC_BASE_URL, 'R2_PUBLIC_BASE_URL');
}

export function buildPublicImageUrl(key) {
  const baseUrl = getPublicBaseUrl().replace(/\/$/, '');
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${baseUrl}/${encodedKey}`;
}

export async function streamToString(stream) {
  if (typeof stream.text === 'function') {
    return stream.text();
  }

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
