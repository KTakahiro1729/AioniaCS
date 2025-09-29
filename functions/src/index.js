import { Router } from 'itty-router';
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { IMAGE_SETTINGS } from '../../src/config/imageSettings.js';
import { verifyToken } from './utils/auth.js';
import {
  assertValidImageKey,
  buildCharacterKey,
  ensureImageOwnership,
  generateImageKey,
  getBucketName,
  getR2Client,
  streamToString,
  streamToUint8Array,
} from './utils/r2.js';
import { errorResponse, okResponse } from './utils/responses.js';

const router = Router();

function resolveExtension(file) {
  const nameExtension = file.name?.split('.').pop();
  if (nameExtension) {
    return nameExtension;
  }
  const mimeExtension = file.type?.split('/').pop();
  if (mimeExtension === 'jpeg') {
    return 'jpg';
  }
  return mimeExtension || 'png';
}

function withAuth(handler) {
  return async (request, env, ctx) => {
    const auth = await verifyToken(request, env);
    if (!auth.ok) {
      return errorResponse(auth.status, auth.message);
    }

    return handler(request, env, ctx, auth.userId);
  };
}

router.get(
  '/api/list-characters',
  withAuth(async (request, env, ctx, userId) => {
    const client = getR2Client(env);
    const bucket = getBucketName(env);
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${userId}/`,
    });
    const { Contents = [] } = await client.send(command);

    const characters = Contents.filter((item) => item.Key && item.Key.endsWith('.json')).map((item) => ({
      id: item.Key.replace(`${userId}/`, '').replace(/\.json$/, ''),
      size: typeof item.Size === 'number' ? item.Size : null,
      lastModified: item.LastModified ? new Date(item.LastModified).toISOString() : null,
    }));

    return okResponse({ characters });
  }),
);

router.get(
  '/api/get-character',
  withAuth(async (request, env, ctx, userId) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return errorResponse(400, 'Character ID is required');
    }

    try {
      const client = getR2Client(env);
      const bucket = getBucketName(env);
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: buildCharacterKey(userId, id),
      });
      const response = await client.send(command);
      const body = await streamToString(response.Body);

      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const notFound = error?.$metadata?.httpStatusCode === 404 || error?.name === 'NoSuchKey' || error?.Code === 'NoSuchKey';
      if (notFound) {
        return errorResponse(404, 'Character not found');
      }

      console.error('Failed to get character:', error);
      return errorResponse(500, 'Failed to get character');
    }
  }),
);

router.post(
  '/api/save-character',
  withAuth(async (request, env, ctx, userId) => {
    let character;
    try {
      character = await request.json();
    } catch (error) {
      return errorResponse(400, 'Invalid JSON body');
    }

    if (!character || typeof character !== 'object') {
      return errorResponse(400, 'Request body is required');
    }

    const { id } = character;
    if (!id) {
      return errorResponse(400, 'Character ID is required in payload');
    }

    try {
      const client = getR2Client(env);
      const bucket = getBucketName(env);
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: buildCharacterKey(userId, id),
        Body: JSON.stringify(character),
        ContentType: 'application/json',
      });
      await client.send(command);

      return okResponse({ id, message: 'Character saved' });
    } catch (error) {
      console.error('Failed to save character:', error);
      return errorResponse(500, 'Failed to save character');
    }
  }),
);

router.delete(
  '/api/delete-character',
  withAuth(async (request, env, ctx, userId) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return errorResponse(400, 'Character ID is required');
    }

    try {
      const client = getR2Client(env);
      const bucket = getBucketName(env);
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: buildCharacterKey(userId, id),
      });
      await client.send(command);

      return okResponse({ id, message: 'Character deleted' });
    } catch (error) {
      console.error('Failed to delete character:', error);
      return errorResponse(500, 'Failed to delete character');
    }
  }),
);

router.post(
  '/api/upload-character-image',
  withAuth(async (request, env, ctx, userId) => {
    let form;
    try {
      form = await request.formData();
    } catch (error) {
      console.error('Failed to parse multipart form:', error);
      return errorResponse(400, error.message || 'Invalid upload payload');
    }
    const file = form.get('image');
    if (!(file instanceof File)) {
      return errorResponse(400, '画像ファイルが見つかりません。');
    }

    if (!IMAGE_SETTINGS.ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(400, '対応していない画像形式です。');
    }

    if (file.size > IMAGE_SETTINGS.MAX_FILE_SIZE_BYTES) {
      return errorResponse(400, 'アップロード可能なサイズを超えています。');
    }

    const extension = resolveExtension(file);
    const key = generateImageKey(userId, extension);

    try {
      const client = getR2Client(env);
      const bucket = getBucketName(env);
      const body = new Uint8Array(await file.arrayBuffer());
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
      });
      await client.send(command);

      return okResponse({ key });
    } catch (error) {
      console.error('Failed to upload image:', error);
      return errorResponse(500, '画像のアップロードに失敗しました。');
    }
  }),
);

router.delete(
  '/api/delete-character-image',
  withAuth(async (request, env, ctx, userId) => {
    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return errorResponse(400, 'Invalid JSON body');
    }

    if (!payload || typeof payload !== 'object') {
      return errorResponse(400, 'Request body is required');
    }

    const { key } = payload;
    if (!key) {
      return errorResponse(400, '画像キーが必要です。');
    }

    try {
      assertValidImageKey(key);
      ensureImageOwnership(userId, key);
    } catch (error) {
      return errorResponse(400, error.message || 'Invalid image reference');
    }

    try {
      const client = getR2Client(env);
      const bucket = getBucketName(env);
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      await client.send(command);

      return okResponse({ message: 'Image deleted', key });
    } catch (error) {
      console.error('Failed to delete image:', error);
      return errorResponse(500, '画像の削除に失敗しました。');
    }
  }),
);

router.get('/api/get-character-image', async (request, env) => {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return errorResponse(400, '画像キーが必要です。');
  }

  try {
    assertValidImageKey(key);
  } catch (error) {
    return errorResponse(400, error.message || 'Invalid image key');
  }

  try {
    const client = getR2Client(env);
    const bucket = getBucketName(env);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await client.send(command);
    const body = await streamToUint8Array(response.Body);

    const headers = new Headers();
    headers.set('Content-Type', response.ContentType || 'application/octet-stream');
    headers.set('Cache-Control', response.CacheControl || 'public, max-age=31536000, immutable');
    headers.set('Content-Length', String(body.byteLength));

    if (response.ETag) {
      headers.set('ETag', response.ETag);
    }

    if (response.LastModified) {
      const lastModified = new Date(response.LastModified);
      if (!Number.isNaN(lastModified.getTime())) {
        headers.set('Last-Modified', lastModified.toUTCString());
      }
    }

    return new Response(body, { status: 200, headers });
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) {
      return errorResponse(404, '画像が見つかりませんでした。');
    }

    console.error('Failed to retrieve image from R2:', error);
    return errorResponse(500, '画像の取得に失敗しました。');
  }
});

router.all('*', () => errorResponse(404, 'Not Found'));

export default {
  async fetch(request, env, ctx) {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Unhandled worker error:', error);
      return errorResponse(500, 'Internal Server Error');
    }
  },
};
