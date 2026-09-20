async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

let currentUser;
async function getUser() {
  if (currentUser !== undefined) return currentUser;
  currentUser = (await api('/api/auth/me')).user;
  return currentUser;
}

async function redirectToLogin() {
  const returnTo = `${window.location.pathname.split('/').pop()}${window.location.search}`;
  window.location.replace(`login.html?returnTo=${encodeURIComponent(returnTo)}`);
}

async function requireUser() {
  const user = await getUser();
  if (!user) await redirectToLogin();
  return user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user?.role !== 'admin') window.location.replace('index.html');
  return user;
}

window.MangaAuth = {
  api,
  getUser,
  requireUser,
  requireAdmin,
  register: (username, password) => api('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  signIn: (username, password) => api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  signOut: async () => { await api('/api/auth/logout', { method: 'POST' }); window.location.href = 'index.html'; },
};
