import { useAuth0 } from '@auth0/auth0-vue';

const API_BASE_PATH = '/.netlify/functions';

function buildUrl(endpoint, params) {
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  let url = `${API_BASE_PATH}/${path}`;

  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch (error) {
    console.error('Failed to read response body:', error);
    return null;
  }
}

export class ApiManager {
  constructor(getAccessTokenSilently) {
    this.getAccessTokenSilently = getAccessTokenSilently;
  }

  async request(endpoint, options = {}) {
    const auth = this._ensureAuth();
    const token = await auth();

    const method = options.method || 'GET';
    const url = buildUrl(endpoint, options.params);

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const fetchOptions = { method, headers };

    if (options.body !== undefined) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const message = payload?.error || response.statusText || 'API request failed';
      const error = new Error(message);
      error.status = response.status;
      error.body = payload;
      throw error;
    }

    return payload;
  }

  listCharacters() {
    return this.request('list-characters');
  }

  getCharacter(id) {
    if (!id) {
      throw new Error('Character ID is required.');
    }
    return this.request('get-character', { params: { id } });
  }

  saveCharacter(character) {
    return this.request('save-character', { method: 'POST', body: character });
  }

  deleteCharacter(id) {
    if (!id) {
      throw new Error('Character ID is required.');
    }
    return this.request('delete-character', { method: 'DELETE', params: { id } });
  }

  _ensureAuth() {
    if (typeof this.getAccessTokenSilently === 'function') {
      return this.getAccessTokenSilently;
    }

    const { getAccessTokenSilently } = useAuth0();
    if (typeof getAccessTokenSilently !== 'function') {
      throw new Error('Auth0 client is not available.');
    }

    this.getAccessTokenSilently = getAccessTokenSilently;
    return this.getAccessTokenSilently;
  }
}
