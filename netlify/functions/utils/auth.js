import { createRemoteJWKSet, jwtVerify } from 'jose';

const { VITE_AUTH0_DOMAIN, AUTH0_API_AUDIENCE } = process.env;
const JWKS = createRemoteJWKSet(new URL(`https://${VITE_AUTH0_DOMAIN}/.well-known/jwks.json`));

export async function verifyToken(event) {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: 'Unauthorized: No token provided' };
  }

  const token = authHeader.substring(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${VITE_AUTH0_DOMAIN}/`,
      audience: AUTH0_API_AUDIENCE || `https://${VITE_AUTH0_DOMAIN}/api/v2/`,
    });
    return { statusCode: 200, userId: payload.sub };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { statusCode: 401, body: `Unauthorized: ${error.message}` };
  }
}
