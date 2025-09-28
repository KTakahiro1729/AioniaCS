import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getBucketName, getR2Client, assertValidImageKey, streamToBuffer } from './utils/r2.js';

const client = getR2Client();
const bucket = getBucketName();

function jsonResponse(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, 'Method Not Allowed');
  }

  const key = event.queryStringParameters?.key;
  if (!key) {
    return jsonResponse(400, '画像キーが必要です。');
  }

  try {
    assertValidImageKey(key);
  } catch (error) {
    return jsonResponse(400, error.message || 'Invalid image key');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await client.send(command);
    const buffer = await streamToBuffer(response.Body);
    const headers = {
      'Content-Type': response.ContentType || 'application/octet-stream',
      'Cache-Control': response.CacheControl || 'public, max-age=31536000, immutable',
      'Content-Length': buffer.length.toString(),
    };

    if (response.ETag) {
      headers.ETag = response.ETag;
    }

    if (response.LastModified) {
      headers['Last-Modified'] = new Date(response.LastModified).toUTCString();
    }

    return {
      statusCode: 200,
      headers,
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) {
      return jsonResponse(404, '画像が見つかりませんでした。');
    }

    console.error('Failed to retrieve image from R2:', error);
    return jsonResponse(500, '画像の取得に失敗しました。');
  }
};
