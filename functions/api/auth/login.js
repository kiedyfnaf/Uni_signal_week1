import { createSession, json, readJson, sessionCookie, verifyPassword } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await readJson(request);
    const user = await env.DB.prepare('SELECT id, username, role, password_hash FROM users WHERE username = ? COLLATE NOCASE').bind(String(username || '').trim()).first();
    if (!user || !(await verifyPassword(String(password || ''), user.password_hash))) return json({ error: 'Incorrect username or password.' }, 401);
    const cookie = await createSession(user.id, env);
    return json({ user: { id: user.id, username: user.username, role: user.role } }, 200, { 'Set-Cookie': sessionCookie(cookie, new URL(request.url).protocol === 'https:') });
  } catch {
    return json({ error: 'Could not sign in.' }, 500);
  }
}
