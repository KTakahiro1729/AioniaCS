import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from './utils/auth.js';
import { getBucketName, getR2Client, extractKeyFromUrl, ensureImageOwnership } from './utils/r2.js';

const client = getR2Client();
const bucket = getBucketName();

export const handler = async (event) => {
  if (event.httpMethod !== 'DELETE') {
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

  const { url } = payload;
  if (!url) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '画像URLが必要です。' }),
    };
  }

  let key;
  try {
    key = extractKeyFromUrl(url);
    ensureImageOwnership(auth.userId, key);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Invalid image reference' }),
    };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await client.send(command);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Image deleted', url }),
    };
  } catch (error) {
    console.error('Failed to delete image:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '画像の削除に失敗しました。' }),
    };
  }
};
