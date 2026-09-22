import { authErrorResponse, json, parseManga, readJson, requireAdmin, requireUser } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const result = await env.DB.prepare(`SELECT manga.*, users.username AS creatorName, COALESCE(manga_views.viewed, 0) AS viewed
      FROM manga JOIN users ON users.id = manga.creator_id
      LEFT JOIN manga_views ON manga_views.manga_id = manga.id AND manga_views.user_id = ?
      ORDER BY manga.created_at DESC`).bind(user.id).all();
    return json({ manga: result.results.map(parseManga) });
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    throw error;
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireAdmin(request, env);
    const data = await readJson(request);
    const title = String(data.title || '').trim();
    const author = String(data.author || '').trim();
    if (!title || !author || !String(data.notes || '').trim()) return json({ error: 'Title, author, and notes are required.' }, 400);
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO manga (id, title, author, genre, link_url, link_description, cover, chapter, tags_json, notes, notes_attachment_json, cover_image, panel_images_json, ratings_json, creator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, title, author, String(data.genre || ''), String(data.linkUrl || ''), String(data.linkDescription || ''), String(data.cover || ''), String(data.chapter || ''), JSON.stringify(data.tags || []), String(data.notes || ''), JSON.stringify(data.notesAttachment || {}), String(data.coverImage || ''), JSON.stringify(data.panelImages || []), JSON.stringify(data.ratings || []), user.id,
    ).run();
    return json({ manga: { id, title, author, creatorName: user.username, viewed: false } }, 201);
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
