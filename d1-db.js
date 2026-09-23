import { hashPassword } from './functions/api/_utils.js';

export async function createInMemoryD1() {
  const users = new Map();
  const sessions = new Map();
  const mangas = new Map();
  const mangaViews = new Map();

  // Create initial admin user
  const adminId = 'admin-user-id';
  const adminPasswordHash = await hashPassword('admin12345');
  users.set(adminId, {
    id: adminId,
    username: 'admin',
    password_hash: adminPasswordHash,
    role: 'admin',
    created_at: new Date('2026-09-01T00:00:00Z').toISOString(),
  });

  // Seed sample manga: none (empty database so user manages their own manga)
  return {
    prepare(sql) {
      const normalizedSql = sql.trim().replace(/\s+/g, ' ');

      function createStatement(args = []) {
        return {
          bind(...newArgs) {
            return createStatement(newArgs);
          },
          async first() {
            // 1. SELECT id, username, role, password_hash FROM users WHERE username = ? COLLATE NOCASE
              if (normalizedSql.includes('FROM users WHERE username = ?')) {
                const targetUsername = String(args[0] || '').toLowerCase();
                for (const u of users.values()) {
                  if (u.username.toLowerCase() === targetUsername) {
                    return { id: u.id, username: u.username, role: u.role, password_hash: u.password_hash };
                  }
                }
                return null;
              }

              // 1b. SELECT id FROM users ...
              if (normalizedSql.includes('FROM users')) {
                const firstUser = users.values().next().value;
                return firstUser ? { id: firstUser.id, username: firstUser.username, role: firstUser.role } : null;
              }

              // 2. SELECT users.id, users.username, users.role FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > datetime('now')
              if (normalizedSql.includes('FROM sessions JOIN users')) {
                const tokenHash = args[0];
                const now = new Date();
                for (const s of sessions.values()) {
                  if (s.token_hash === tokenHash && new Date(s.expires_at) > now) {
                    const user = users.get(s.user_id);
                    if (user) {
                      return { id: user.id, username: user.username, role: user.role };
                    }
                  }
                }
                return null;
              }

              // 3. SELECT id FROM manga WHERE id = ?
              if (normalizedSql.includes('SELECT id FROM manga WHERE id = ?')) {
                const mangaId = args[0];
                const mangaTitle = args[1] ? String(args[1]).toLowerCase() : null;
                let manga = mangas.get(mangaId);
                if (!manga && mangaTitle) {
                  for (const m of mangas.values()) {
                    if (m.title.toLowerCase() === mangaTitle) {
                      manga = m;
                      break;
                    }
                  }
                }
                return manga ? { id: manga.id } : null;
              }

              // 4. SELECT manga.*, users.username AS creatorName, COALESCE(manga_views.viewed, 0) AS viewed FROM manga LEFT JOIN users ON users.id = manga.creator_id LEFT JOIN manga_views ON manga_views.manga_id = manga.id AND manga_views.user_id = ? WHERE manga.id = ? ...
              if (normalizedSql.includes('WHERE manga.id = ?')) {
                const userId = args[0];
                const mangaId = args[1];
                let manga = mangas.get(mangaId);
                if (!manga) {
                  const targetLower = String(mangaId).toLowerCase();
                  for (const item of mangas.values()) {
                    if (item.id === mangaId || item.title.toLowerCase() === targetLower) {
                      manga = item;
                      break;
                    }
                  }
                }
                if (!manga) return null;
                const creator = users.get(manga.creator_id);
                const view = mangaViews.get(`${userId}:${manga.id}`);
                return {
                  ...manga,
                  creatorName: creator ? creator.username : 'MangaShelf',
                  viewed: view ? view.viewed : 0,
                };
              }

              // 4b. General SELECT from manga WHERE id = ?
              if (normalizedSql.includes('FROM manga') && normalizedSql.includes('WHERE')) {
                for (const arg of args) {
                  if (!arg) continue;
                  const targetLower = String(arg).toLowerCase();
                  for (const item of mangas.values()) {
                    if (item.id === arg || item.title.toLowerCase() === targetLower) {
                      const creator = users.get(item.creator_id);
                      return {
                        ...item,
                        creatorName: creator ? creator.username : 'MangaShelf',
                        viewed: 0,
                      };
                    }
                  }
                }
              }

              return null;
            },

            async all() {
              // 1. SELECT manga.*, users.username AS creatorName, COALESCE(manga_views.viewed, 0) AS viewed FROM manga ...
              if (normalizedSql.includes('FROM manga JOIN users') || normalizedSql.includes('FROM manga LEFT JOIN users')) {
                const userId = args[0];
                const results = [];
                for (const manga of mangas.values()) {
                  const creator = users.get(manga.creator_id);
                  const view = mangaViews.get(`${userId}:${manga.id}`);
                  results.push({
                    ...manga,
                    creatorName: creator ? creator.username : 'MangaShelf',
                    viewed: view ? view.viewed : 0,
                  });
                }
                results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                return { results };
              }

              return { results: [] };
            },

            async run() {
              // 1. INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)
              if (normalizedSql.startsWith('INSERT INTO users') || normalizedSql.startsWith('INSERT OR IGNORE INTO users')) {
                const [id, username, password_hash, role] = args;
                const cleanUsername = String(username).toLowerCase();
                for (const u of users.values()) {
                  if (u.username.toLowerCase() === cleanUsername) {
                    if (normalizedSql.startsWith('INSERT OR IGNORE')) return { success: true, meta: { changes: 0 } };
                    throw new Error('UNIQUE constraint failed: users.username');
                  }
                }
                users.set(id, {
                  id,
                  username,
                  password_hash,
                  role,
                  created_at: new Date().toISOString(),
                });
                return { success: true, meta: { changes: 1 } };
              }

              // 2. INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, datetime('now', '+30 days'))
              if (normalizedSql.startsWith('INSERT INTO sessions')) {
                const [id, user_id, token_hash] = args;
                const expires_at = new Date(Date.now() + 30 * 86400000).toISOString();
                sessions.set(id, {
                  id,
                  user_id,
                  token_hash,
                  expires_at,
                  created_at: new Date().toISOString(),
                });
                return { success: true, meta: { changes: 1 } };
              }

              // 3. DELETE FROM sessions WHERE token_hash = ?
              if (normalizedSql.startsWith('DELETE FROM sessions WHERE token_hash = ?')) {
                const tokenHash = args[0];
                for (const [key, s] of sessions.entries()) {
                  if (s.token_hash === tokenHash) {
                    sessions.delete(key);
                  }
                }
                return { success: true, meta: { changes: 1 } };
              }

              // 4. INSERT INTO manga (...) VALUES (...)
              if (normalizedSql.startsWith('INSERT INTO manga (id,') || normalizedSql.startsWith('INSERT OR IGNORE INTO manga') || normalizedSql.startsWith('INSERT OR REPLACE INTO manga')) {
                const [
                  id, title, author, genre, link_url, link_description,
                  cover, chapter, tags_json, notes, notes_attachment_json,
                  cover_image, panel_images_json, ratings_json, creator_id,
                ] = args;
                if (normalizedSql.startsWith('INSERT OR IGNORE INTO manga') && mangas.has(id)) {
                  return { success: true, meta: { changes: 0 } };
                }
                mangas.set(id, {
                  id,
                  title,
                  author,
                  genre,
                  link_url,
                  link_description,
                  cover,
                  chapter,
                  tags_json,
                  notes,
                  notes_attachment_json,
                  cover_image,
                  panel_images_json,
                  ratings_json,
                  creator_id,
                  created_at: new Date().toISOString(),
                });
                return { success: true, meta: { changes: 1 } };
              }

              // 5. INSERT INTO manga_views (user_id, manga_id, viewed) VALUES (?, ?, ?) ON CONFLICT ...
              if (normalizedSql.startsWith('INSERT INTO manga_views')) {
                const [userId, mangaId, viewed] = args;
                mangaViews.set(`${userId}:${mangaId}`, {
                  user_id: userId,
                  manga_id: mangaId,
                  viewed: Number(viewed),
                  updated_at: new Date().toISOString(),
                });
                return { success: true, meta: { changes: 1 } };
              }

              // 6. DELETE FROM manga WHERE id = ?
              if (normalizedSql.startsWith('DELETE FROM manga WHERE')) {
                const target = String(args[0] || '').toLowerCase();
                let deletedCount = 0;
                for (const [key, m] of mangas.entries()) {
                  if (m.id === args[0] || m.title.toLowerCase() === target) {
                    mangas.delete(key);
                    deletedCount += 1;
                  }
                }
                return { success: true, meta: { changes: deletedCount } };
              }

              // 7. DELETE FROM manga_views WHERE manga_id = ?
              if (normalizedSql.startsWith('DELETE FROM manga_views WHERE')) {
                const mangaId = args[0];
                let deletedViews = 0;
                for (const [key, v] of mangaViews.entries()) {
                  if (v.manga_id === mangaId) {
                    mangaViews.delete(key);
                    deletedViews += 1;
                  }
                }
                return { success: true, meta: { changes: deletedViews } };
              }

              return { success: true, meta: { changes: 0 } };
            },
          };
        }

        return createStatement([]);
      },
  };
}
