CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manga (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '',
  link_description TEXT NOT NULL DEFAULT '',
  cover TEXT NOT NULL DEFAULT '',
  chapter TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  notes_attachment_json TEXT NOT NULL DEFAULT '{}',
  cover_image TEXT NOT NULL DEFAULT '',
  panel_images_json TEXT NOT NULL DEFAULT '[]',
  ratings_json TEXT NOT NULL DEFAULT '[]',
  creator_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manga_views (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id TEXT NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  viewed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, manga_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_manga_created_at ON manga(created_at);
CREATE INDEX IF NOT EXISTS idx_manga_views_user ON manga_views(user_id);

-- Initial default admin and sample manga
INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES ('admin-user-id', 'admin', '888019e0ea9ca81014e44bb46592231e:07fa689e47f5cfbebf0bbf9b79d239c0fa1a942071f0ea0949d2112a2bfdfa86', 'admin');

INSERT OR IGNORE INTO manga (id, title, author, genre, link_url, link_description, cover, chapter, tags_json, notes, notes_attachment_json, cover_image, panel_images_json, ratings_json, creator_id, created_at)
VALUES
  ('manga-dandadan', 'Dandadan', 'Yukinobu Tatsu', 'Action / Supernatural', '', '', 'cover-dandadan', 'VOL. 04', '["Action","Supernatural","Aliens","Ghosts"]', 'Chaotic, funny, and impossible to put down.', '{}', '', '[]', '[]', 'admin-user-id', '2026-09-19 10:00:00'),
  ('manga-blue-period', 'Blue Period', 'Tsubasa Yamaguchi', 'Drama / Art', '', '', 'cover-blue', 'VOL. 08', '["Drama","Art","School","Growth"]', 'A quiet story about finding a language for feeling.', '{}', '', '[]', '[]', 'admin-user-id', '2026-09-18 10:00:00'),
  ('manga-frieren', 'Frieren', 'Kanehito Yamada', 'Fantasy / Adventure', '', '', 'cover-frieren', 'VOL. 06', '["Fantasy","Adventure","Magic","Melancholy"]', 'A tender reminder that time gives small moments their weight.', '{}', '', '[]', '[]', 'admin-user-id', '2026-09-17 10:00:00'),
  ('manga-witch-hat', 'Witch Hat Atelier', 'Kamome Shirahama', 'Fantasy / Magic', '', '', 'cover-witch', 'VOL. 12', '["Fantasy","Magic","Art","Wonder"]', 'Every page feels like opening a secret door into another world.', '{}', '', '[]', '[]', 'admin-user-id', '2026-09-16 10:00:00');

