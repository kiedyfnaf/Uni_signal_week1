import { json, parseManga, requireUser } from '../_utils.js';

export async function onRequestGet({ request, env, params }) {
  const user = await requireUser(request, env);
  const row = await env.DB.prepare(`SELECT manga.*, users.username AS creatorName, COALESCE(manga_views.viewed, 0) AS viewed
    FROM manga JOIN users ON users.id = manga.creator_id
    LEFT JOIN manga_views ON manga_views.manga_id = manga.id AND manga_views.user_id = ?
    WHERE manga.id = ?`).bind(user.id, params.id).first();
  if (!row) return json({ error: 'Manga not found.' }, 404);
  return json({ manga: parseManga(row) });
}
