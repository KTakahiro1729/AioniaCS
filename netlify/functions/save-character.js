import { PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from './utils/auth.js';
import { buildCharacterKey, getBucketName, getR2Client } from './utils/r2.js';

const client = getR2Client();
const bucket = getBucketName();

export const handler = async (event) => {
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

  let character;
  try {
    character = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const { id } = character;
  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Character ID is required in payload' }),
    };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: buildCharacterKey(auth.userId, id),
      Body: JSON.stringify(character),
      ContentType: 'application/json',
    });
    await client.send(command);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, message: 'Character saved' }),
    };
  } catch (error) {
    console.error('Failed to save character:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to save character' }),
    };
  }
};
