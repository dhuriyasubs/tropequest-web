-- Run once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shelf (
  id         SERIAL PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id    INTEGER     NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status     TEXT        NOT NULL DEFAULT 'owned'
               CHECK (status IN ('owned', 'reading', 'read')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS shelf_user_idx   ON shelf (user_id);
CREATE INDEX IF NOT EXISTS shelf_book_idx   ON shelf (book_id);
CREATE INDEX IF NOT EXISTS shelf_status_idx ON shelf (user_id, status);

ALTER TABLE shelf ENABLE ROW LEVEL SECURITY;

-- Users can only see their own shelf
CREATE POLICY "Users read own shelf"   ON shelf FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own shelf" ON shelf FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own shelf" ON shelf FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own shelf" ON shelf FOR DELETE USING (auth.uid() = user_id);
