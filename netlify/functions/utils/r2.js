import { S3Client } from '@aws-sdk/client-s3';

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

let client;
const IMAGE_FOLDER = 'images';

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

  const prefix = `${userId}/${IMAGE_FOLDER}/`;
  if (!key.startsWith(prefix)) {
    throw new Error('You do not have permission to modify this image.');
  }
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

export async function streamToBuffer(stream) {
  if (!stream) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(stream)) {
    return stream;
  }

  if (typeof stream.arrayBuffer === 'function') {
    const arrayBuffer = await stream.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  if (typeof stream.transformToByteArray === 'function') {
    const byteArray = await stream.transformToByteArray();
    return Buffer.from(byteArray);
  }

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
