import { GetObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from './utils/auth.js';
import { buildCharacterKey, getBucketName, getR2Client, streamToString } from './utils/r2.js';

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
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: buildCharacterKey(auth.userId, characterId),
    });
    const response = await client.send(command);
    const body = await streamToString(response.Body);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body,
    };
  } catch (error) {
    const notFound = error.$metadata?.httpStatusCode === 404 || error.name === 'NoSuchKey' || error.Code === 'NoSuchKey';
    if (notFound) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Character not found' }),
      };
    }

    console.error('Failed to get character:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get character' }),
    };
  }
};
