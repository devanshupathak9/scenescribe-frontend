const BASE = '/api';

// Never attach the auth token to these endpoints
const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token && !PUBLIC_PATHS.includes(path)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, options);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // non-JSON body (proxy error, etc.) — treat as server error
    throw new Error(`Request failed (${res.status})`);
  }

  if (!res.ok) {
    // If token is rejected on a protected route, clear it so the app re-authenticates
    if (res.status === 401 && !PUBLIC_PATHS.includes(path)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    const message = data.error?.message || data.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  patch:  (path, body) => request('PATCH',  path, body),
  delete: (path)       => request('DELETE', path),
};
