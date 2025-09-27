import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from './utils/auth.js';
import { buildCharacterKey, getBucketName, getR2Client } from './utils/r2.js';

const client = getR2Client();
const bucket = getBucketName();

export const handler = async (event) => {
  const auth = await verifyToken(event);
  if (auth.statusCode !== 200) {
    return auth;
  }

  const characterId = event.queryStringParameters?.id;
  if (!characterId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Character ID is required' }),
    };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: buildCharacterKey(auth.userId, characterId),
    });
    await client.send(command);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: characterId, message: 'Character deleted' }),
    };
  } catch (error) {
    console.error('Failed to delete character:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete character' }),
    };
  }
};
