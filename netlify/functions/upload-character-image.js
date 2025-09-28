import { PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from './utils/auth.js';
import { getBucketName, getR2Client, generateImageKey, buildPublicUrl } from './utils/r2.js';
import { parseMultipartForm } from './utils/form.js';
import { IMAGE_SETTINGS } from '../../src/config/imageSettings.js';

const client = getR2Client();
const bucket = getBucketName();

function resolveExtension(file) {
  const nameExtension = file.filename?.split('.').pop();
  if (nameExtension) {
    return nameExtension;
  }
  const mimeExtension = file.mimeType?.split('/').pop();
  if (mimeExtension === 'jpeg') {
    return 'jpg';
  }
  return mimeExtension || 'png';
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

  let form;
  try {
    form = await parseMultipartForm(event, {
      limits: { fileSize: IMAGE_SETTINGS.MAX_FILE_SIZE_BYTES },
    });
  } catch (error) {
    console.error('Failed to parse multipart form:', error);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Invalid upload payload' }),
    };
  }

  const file = form.files.find((f) => f.fieldname === 'image');
  if (!file) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '画像ファイルが見つかりません。' }),
    };
  }

  if (!IMAGE_SETTINGS.ALLOWED_TYPES.includes(file.mimeType)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '対応していない画像形式です。' }),
    };
  }

  const extension = resolveExtension(file);
  const key = generateImageKey(auth.userId, extension);

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimeType,
    });
    await client.send(command);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: buildPublicUrl(key), key }),
    };
  } catch (error) {
    console.error('Failed to upload image:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '画像のアップロードに失敗しました。' }),
    };
  }
};
