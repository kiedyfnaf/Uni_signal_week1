import { authErrorResponse, ensureMangaSchema, json, readJson, requireUser } from '../../_utils.js';

export async function onRequestPost({ request, env, params }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is unavailable.' }, 503);
    await ensureMangaSchema(env.DB);
    const user = await requireUser(request, env);
    const { viewed } = await readJson(request);
    if (typeof viewed !== 'boolean') return json({ error: 'Viewed must be true or false.' }, 400);
    const manga = await env.DB.prepare('SELECT id FROM manga WHERE id = ?').bind(params.id).first();
    if (!manga) return json({ error: 'Manga not found.' }, 404);
    await env.DB.prepare(`INSERT INTO manga_views (user_id, manga_id, viewed) VALUES (?, ?, ?)
      ON CONFLICT(user_id, manga_id) DO UPDATE SET viewed = excluded.viewed, updated_at = CURRENT_TIMESTAMP`).bind(user.id, params.id, viewed ? 1 : 0).run();
    return json({ viewed });
  } catch (error) {
    console.error('Error updating viewed status:', error);
    const response = authErrorResponse(error);
    if (response) return response;
    return json({ error: error.message || 'Could not update viewed status.' }, 500);
  }
}
