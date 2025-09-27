import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { verifyToken } from './utils/auth.js';
import { getR2Client, getBucketName } from './utils/r2.js';

const client = getR2Client();
const bucket = getBucketName();

export const handler = async (event) => {
  const auth = await verifyToken(event);
  if (auth.statusCode !== 200) {
    return auth;
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${auth.userId}/`,
    });
    const { Contents = [] } = await client.send(command);

    const characters = Contents.filter((item) => item.Key && item.Key.endsWith('.json')).map((item) => ({
      id: item.Key.replace(`${auth.userId}/`, '').replace(/\.json$/, ''),
      size: item.Size ?? null,
      lastModified: item.LastModified ? item.LastModified.toISOString() : null,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characters }),
    };
  } catch (error) {
    console.error('Failed to list characters:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to list characters' }),
    };
  }
};
