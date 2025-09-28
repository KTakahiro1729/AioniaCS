import { GetObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from './utils/auth.js';
import { getBucketName, getR2Client, ensureImageOwnership, streamToBuffer } from './utils/r2.js';

const client = getR2Client();
const bucket = getBucketName();

function jsonResponse(statusCode, error) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error }),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, 'Method Not Allowed');
  }

  const auth = await verifyToken(event);
  if (auth.statusCode !== 200) {
    return auth;
  }

  const rawKey = event.queryStringParameters?.key;
  const key = typeof rawKey === 'string' ? rawKey.trim() : '';
  if (!key) {
    return jsonResponse(400, '画像キーが必要です。');
  }

  try {
    ensureImageOwnership(auth.userId, key);
  } catch (error) {
    return jsonResponse(403, error.message || 'Invalid image reference');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const result = await client.send(command);

    const buffer = await streamToBuffer(result.Body);
    const contentType = result.ContentType || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': result.CacheControl || 'public, max-age=3600, immutable',
    };

    if (result.ETag) {
      headers.ETag = result.ETag.replace(/"/g, '');
    }
    if (result.LastModified) {
      headers['Last-Modified'] = new Date(result.LastModified).toUTCString();
    }

    return {
      statusCode: 200,
      headers,
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Failed to fetch image from R2:', error);
    const status = error.$metadata?.httpStatusCode || 500;
    if (status === 404) {
      return jsonResponse(404, '指定された画像が見つかりません。');
    }
    return jsonResponse(500, '画像の取得に失敗しました。');
  }
};
