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

  // Seed sample manga
  const sampleMangaList = [
    {
      id: 'manga-dandadan',
      title: 'Dandadan',
      author: 'Yukinobu Tatsu',
      genre: 'Action / Supernatural',
      link_url: '',
      link_description: '',
      cover: 'cover-dandadan',
      chapter: 'VOL. 04',
      tags_json: JSON.stringify(['Action', 'Supernatural', 'Aliens', 'Ghosts']),
      notes: 'Chaotic, funny, and impossible to put down.',
      notes_attachment_json: '{}',
      cover_image: '',
      panel_images_json: '[]',
      ratings_json: JSON.stringify([]),
      creator_id: adminId,
      created_at: new Date('2026-09-19T10:00:00Z').toISOString(),
    },
    {
      id: 'manga-blue-period',
      title: 'Blue Period',
      author: 'Tsubasa Yamaguchi',
      genre: 'Drama / Art',
      link_url: '',
      link_description: '',
      cover: 'cover-blue',
      chapter: 'VOL. 08',
      tags_json: JSON.stringify(['Drama', 'Art', 'School', 'Growth']),
      notes: 'A quiet story about finding a language for feeling.',
      notes_attachment_json: '{}',
      cover_image: '',
      panel_images_json: '[]',
      ratings_json: JSON.stringify([]),
      creator_id: adminId,
      created_at: new Date('2026-09-18T10:00:00Z').toISOString(),
    },
    {
      id: 'manga-frieren',
      title: 'Frieren',
      author: 'Kanehito Yamada',
      genre: 'Fantasy / Adventure',
      link_url: '',
      link_description: '',
      cover: 'cover-frieren',
      chapter: 'VOL. 06',
      tags_json: JSON.stringify(['Fantasy', 'Adventure', 'Magic', 'Melancholy']),
      notes: 'A tender reminder that time gives small moments their weight.',
      notes_attachment_json: '{}',
      cover_image: '',
      panel_images_json: '[]',
      ratings_json: JSON.stringify([]),
      creator_id: adminId,
      created_at: new Date('2026-09-17T10:00:00Z').toISOString(),
    },
    {
      id: 'manga-witch-hat',
      title: 'Witch Hat Atelier',
      author: 'Kamome Shirahama',
      genre: 'Fantasy / Magic',
      link_url: '',
      link_description: '',
      cover: 'cover-witch',
      chapter: 'VOL. 12',
      tags_json: JSON.stringify(['Fantasy', 'Magic', 'Art', 'Wonder']),
      notes: 'Every page feels like opening a secret door into another world.',
      notes_attachment_json: '{}',
      cover_image: '',
      panel_images_json: '[]',
      ratings_json: JSON.stringify([]),
      creator_id: adminId,
      created_at: new Date('2026-09-16T10:00:00Z').toISOString(),
    },
  ];

  for (const m of sampleMangaList) {
    mangas.set(m.id, m);
  }

  return {
    prepare(sql) {
      const normalizedSql = sql.trim().replace(/\s+/g, ' ');

      return {
        bind(...args) {
          return {
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
                const manga = mangas.get(mangaId);
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
              if (normalizedSql.startsWith('INSERT INTO users')) {
                const [id, username, password_hash, role] = args;
                const cleanUsername = String(username).toLowerCase();
                for (const u of users.values()) {
                  if (u.username.toLowerCase() === cleanUsername) {
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
              if (normalizedSql.startsWith('INSERT INTO manga (id,')) {
                const [
                  id, title, author, genre, link_url, link_description,
                  cover, chapter, tags_json, notes, notes_attachment_json,
                  cover_image, panel_images_json, ratings_json, creator_id,
                ] = args;
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

              return { success: true, meta: { changes: 0 } };
            },
          };
        },
      };
    },
  };
}
