-- Cloudflare D1 schema for storing Google OAuth sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  refresh_token TEXT,
  created_at INTEGER,
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS character_metadata (
  file_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  character_name TEXT,
  file_name TEXT,
  content_hash TEXT,
  has_thumbnail INTEGER DEFAULT 0,
  last_modified_at_drive INTEGER,
  synced_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_character_metadata_user_id ON character_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_character_metadata_synced_at ON character_metadata(synced_at);
