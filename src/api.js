const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, options);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const message = data.error?.message || data.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
