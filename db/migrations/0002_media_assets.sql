CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '' CHECK (length(alt_text) <= 240),
  content_type TEXT NOT NULL,
  bytes INTEGER NOT NULL CHECK (bytes >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX media_assets_created_at_idx ON media_assets(created_at DESC);
