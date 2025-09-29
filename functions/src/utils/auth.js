import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ensureEnv } from './env.js';

const jwksCache = new Map();

function getJwks(domain) {
  if (!jwksCache.has(domain)) {
    const url = new URL(`https://${domain}/.well-known/jwks.json`);
    jwksCache.set(domain, createRemoteJWKSet(url));
  }
  return jwksCache.get(domain);
}

export async function verifyToken(request, env) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Unauthorized: No token provided' };
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, message: 'Unauthorized: No token provided' };
  }

  try {
    const domain = ensureEnv(env.VITE_AUTH0_DOMAIN, 'VITE_AUTH0_DOMAIN');
    const jwks = getJwks(domain);
    const audience = env.AUTH0_API_AUDIENCE || `https://${domain}/api/v2/`;
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://${domain}/`,
      audience,
    });
    return { ok: true, userId: payload.sub };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { ok: false, status: 401, message: `Unauthorized: ${error.message}` };
  }
}
