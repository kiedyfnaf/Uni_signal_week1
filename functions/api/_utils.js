const SESSION_COOKIE = 'manga_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
}

export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function authErrorResponse(error) {
  return error instanceof AuthError ? json({ error: error.message }, error.status) : null;
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('Invalid JSON body.');
  }
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map((byte) => Number.parseInt(byte, 16)));
}

function randomHex(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function sha256(value) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

export async function hashPassword(password, salt = randomHex(16)) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: hexToBytes(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return `${salt}:${bytesToHex(bits)}`;
}

export async function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(':');
  const actual = (await hashPassword(password, salt)).split(':')[1];
  return actual === expected;
}

function cookieValue(request) {
  return request.headers.get('Cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.split('=').slice(1).join('=');
}

export async function currentUser(request, env) {
  const token = cookieValue(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  return env.DB.prepare(`SELECT users.id, users.username, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > datetime('now')`).bind(tokenHash).first();
}

export async function requireUser(request, env) {
  const user = await currentUser(request, env);
  if (!user) throw new AuthError('Authentication required.', 401);
  return user;
}

export async function requireAdmin(request, env) {
  const user = await requireUser(request, env);
  if (user.role !== 'admin') throw new AuthError('Administrator access required.', 403);
  return user;
}

export async function createSession(userId, env) {
  const token = randomHex();
  const tokenHash = await sha256(token);
  const sessionId = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, datetime('now', '+30 days'))`).bind(sessionId, userId, tokenHash).run();
  return { name: SESSION_COOKIE, value: token };
}

export function sessionCookie(cookie, secure = true) {
  return `${cookie.name}=${cookie.value}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie(secure = true) {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function adminNames(env) {
  return String(env.ADMIN_USERNAMES || '').split(',').map((name) => name.trim().toLowerCase()).filter(Boolean);
}

export function parseManga(row) {
  return { ...row, tags: JSON.parse(row.tags_json || '[]'), panelImages: JSON.parse(row.panel_images_json || '[]'), ratings: JSON.parse(row.ratings_json || '[]'), notesAttachment: JSON.parse(row.notes_attachment_json || '{}'), viewed: Boolean(row.viewed), tags_json: undefined, notes_attachment_json: undefined, panel_images_json: undefined, ratings_json: undefined };
}
