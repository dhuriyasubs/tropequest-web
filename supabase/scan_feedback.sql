-- Run once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS scan_feedback (
  id                 SERIAL PRIMARY KEY,
  user_id            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  identified_title   TEXT        NOT NULL,
  identified_author  TEXT,
  correct_title      TEXT,
  correct_author     TEXT,
  notes              TEXT,          -- free-text from the user
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scan_feedback_user_idx ON scan_feedback (user_id);

ALTER TABLE scan_feedback ENABLE ROW LEVEL SECURITY;

-- Users can submit feedback
CREATE POLICY "Users insert feedback" ON scan_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can read their own feedback
CREATE POLICY "Users read own feedback" ON scan_feedback FOR SELECT USING (auth.uid() = user_id);
-- Service role can read all (for pipeline training)
