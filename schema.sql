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

-- Initial default admin
INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES ('admin-user-id', 'admin', '888019e0ea9ca81014e44bb46592231e:07fa689e47f5cfbebf0bbf9b79d239c0fa1a942071f0ea0949d2112a2bfdfa86', 'admin');

