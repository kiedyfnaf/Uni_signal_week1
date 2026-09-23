import { authErrorResponse, currentUser, requireUser, ensureMangaSchema, json, parseManga } from '../_utils.js';

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

export async function onRequestDelete({ request, env, params }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is unavailable.' }, 503);
    await ensureMangaSchema(env.DB);
    const user = await requireUser(request, env);

    // Locate the manga
    const existing = await env.DB.prepare('SELECT id, title, creator_id FROM manga WHERE id = ? OR LOWER(title) = LOWER(?)').bind(params.id, params.id).first();
    if (!existing) {
      return json({ error: 'Manga not found in database.' }, 404);
    }

    // Only administrators or the creator can delete manga
    if (user.role !== 'admin' && existing.creator_id !== user.id) {
      return json({ error: 'Forbidden: Administrator privileges required to remove manga from database.' }, 403);
    }

    // Cascade delete any user view records
    try {
      await env.DB.prepare('DELETE FROM manga_views WHERE manga_id = ?').bind(existing.id).run();
    } catch (viewErr) {
      console.warn('Could not clear manga_views:', viewErr);
    }

    // Delete manga record
    await env.DB.prepare('DELETE FROM manga WHERE id = ?').bind(existing.id).run();

    return json({
      success: true,
      deletedId: existing.id,
      title: existing.title,
      message: `"${existing.title}" was successfully deleted from the database.`
    });
  } catch (error) {
    console.error('Error deleting manga:', error);
    const response = authErrorResponse(error);
    if (response) return response;
    return json({ error: error.message || 'Could not delete manga from database.' }, 500);
  }
}

