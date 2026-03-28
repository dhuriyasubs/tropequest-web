-- Run once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS reel_mentions (
  id         SERIAL PRIMARY KEY,
  reel_url   TEXT        NOT NULL,
  book_id    INTEGER     REFERENCES books(id) ON DELETE CASCADE,
  suggested  BOOLEAN     NOT NULL DEFAULT true,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reel_url, book_id)
);

CREATE INDEX IF NOT EXISTS reel_mentions_book_idx ON reel_mentions (book_id);
CREATE INDEX IF NOT EXISTS reel_mentions_url_idx  ON reel_mentions (reel_url);

ALTER TABLE reel_mentions ENABLE ROW LEVEL SECURITY;

-- Anyone can read (useful for showing "X influencers recommended this book")
CREATE POLICY "Public read" ON reel_mentions FOR SELECT USING (true);

-- Only service role can insert/update (API uses supabaseAdmin)
