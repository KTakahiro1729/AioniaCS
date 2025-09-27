import { PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { verifyToken } from './utils/auth.js';
import { buildCharacterImageKey, buildCharacterImagePrefix, buildPublicImageUrl, getBucketName, getR2Client } from './utils/r2.js';

const client = getR2Client();
const bucket = getBucketName();
const MAX_IMAGES_PER_CHARACTER = 4;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function resolveExtension(contentType) {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    default:
      throw new Error('Unsupported content type');
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const auth = await verifyToken(event);
  if (auth.statusCode !== 200) {
    return auth;
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const { imageFolderId, data, contentType, fileName } = payload;

  if (!imageFolderId || typeof imageFolderId !== 'string') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'imageFolderId is required' }),
    };
  }

  const normalizedType = typeof contentType === 'string' ? contentType.toLowerCase() : '';
  if (!ALLOWED_TYPES.has(normalizedType)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unsupported content type' }),
    };
  }

  if (!data || typeof data !== 'string') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Image data is required' }),
    };
  }

  const prefix = buildCharacterImagePrefix(auth.userId, imageFolderId);

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: MAX_IMAGES_PER_CHARACTER + 1,
    });
    const existing = await client.send(listCommand);
    const count = existing?.Contents?.length || 0;
    if (count >= MAX_IMAGES_PER_CHARACTER) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Image limit reached' }),
      };
    }
  } catch (error) {
    console.error('Failed to list existing images:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to validate existing images' }),
    };
  }

  let buffer;
  try {
    buffer = Buffer.from(data, 'base64');
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid image data' }),
    };
  }

  try {
    const imageId = randomUUID();
    const extension = resolveExtension(normalizedType);
    const objectFileName = `${imageId}.${extension}`;
    const key = buildCharacterImageKey(auth.userId, imageFolderId, objectFileName);
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: normalizedType,
      CacheControl: 'public, max-age=31536000',
    });
    await client.send(putCommand);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: imageId,
        key,
        url: buildPublicImageUrl(key),
        contentType: normalizedType,
        fileName: fileName || objectFileName,
      }),
    };
  } catch (error) {
    console.error('Failed to upload character image:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to upload image' }),
    };
  }
};
