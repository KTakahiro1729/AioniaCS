import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from './utils/auth.js';
import { buildCharacterImagePrefix, getBucketName, getR2Client } from './utils/r2.js';

const client = getR2Client();
const bucket = getBucketName();

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

  const { imageFolderId, key } = payload;

  if (!imageFolderId || typeof imageFolderId !== 'string') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'imageFolderId is required' }),
    };
  }

  if (!key || typeof key !== 'string') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'key is required' }),
    };
  }

  const expectedPrefix = buildCharacterImagePrefix(auth.userId, imageFolderId);
  if (!key.startsWith(expectedPrefix)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Forbidden' }),
    };
  }

  try {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await client.send(command);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    };
  } catch (error) {
    console.error('Failed to delete character image:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete image' }),
    };
  }
};
