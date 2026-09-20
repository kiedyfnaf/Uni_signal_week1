import { clearSessionCookie, currentUser, json, sessionCookie, sha256 } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await currentUser(request, env);
    if (user) {
      const token = request.headers.get('Cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith('manga_session='))?.split('=').slice(1).join('=');
      if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    }
  } catch {}
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(new URL(request.url).protocol === 'https:') });
}
