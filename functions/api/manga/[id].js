import { authErrorResponse, currentUser, ensureMangaSchema, json, parseManga } from '../_utils.js';

export async function onRequestGet({ request, env, params }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is unavailable.' }, 503);
    await ensureMangaSchema(env.DB);
    const user = await currentUser(request, env);
    const userId = user?.id || '';
    const row = await env.DB.prepare(`SELECT manga.*, users.username AS creatorName, COALESCE(manga_views.viewed, 0) AS viewed
    FROM manga LEFT JOIN users ON users.id = manga.creator_id
    LEFT JOIN manga_views ON manga_views.manga_id = manga.id AND manga_views.user_id = ?
    WHERE manga.id = ? OR LOWER(manga.title) = LOWER(?)`).bind(userId, params.id, params.id).first();
    if (!row) return json({ error: 'Manga not found.' }, 404);
    return json({ manga: parseManga(row) });
  } catch (error) {
    console.error('Error loading manga:', error);
    const response = authErrorResponse(error);
    if (response) return response;
    return json({ error: error.message || 'Could not load manga.' }, 500);
  }
}
