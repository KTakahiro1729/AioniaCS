-- Cloudflare D1 schema for storing Google OAuth sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  refresh_token TEXT,
  created_at INTEGER,
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS folder_configs (
  user_id TEXT PRIMARY KEY,
  folder_id TEXT,
  folder_name TEXT,
  folder_path TEXT,
  updated_at INTEGER
);
