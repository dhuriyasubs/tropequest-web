-- User ratings table
CREATE TABLE ratings (
  id         SERIAL PRIMARY KEY,
  user_id    UUID     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id    INTEGER  NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE INDEX ON ratings (user_id);
CREATE INDEX ON ratings (book_id);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads ratings"
  ON ratings FOR SELECT USING (true);

CREATE POLICY "Users insert own ratings"
  ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ratings"
  ON ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own ratings"
  ON ratings FOR DELETE USING (auth.uid() = user_id);
