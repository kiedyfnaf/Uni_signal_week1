import { adminNames, createSession, hashPassword, json, readJson, sessionCookie } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is unavailable in this Pages deployment.' }, 503);
  try {
    const { username, password } = await readJson(request);
    const cleanUsername = String(username || '').trim();
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(cleanUsername)) return json({ error: 'Username must be 3-32 characters and use letters, numbers, _, ., or -.' }, 400);
    if (String(password || '').length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400);
    const id = crypto.randomUUID();
    const role = adminNames(env).includes(cleanUsername.toLowerCase()) ? 'admin' : 'user';
    await env.DB.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').bind(id, cleanUsername, await hashPassword(password), role).run();
    const cookie = await createSession(id, env);
    return json({ user: { id, username: cleanUsername, role } }, 201, { 'Set-Cookie': sessionCookie(cookie, new URL(request.url).protocol === 'https:') });
  } catch (error) {
    console.error('Registration failed:', error);
    if (String(error.message).includes('UNIQUE')) return json({ error: 'That username is already taken.' }, 409);
    if (String(error.message).toLowerCase().includes('no such table')) return json({ error: 'D1 schema is missing the users table.' }, 500);
    return json({ error: 'Could not create account.' }, 500);
  }
}
