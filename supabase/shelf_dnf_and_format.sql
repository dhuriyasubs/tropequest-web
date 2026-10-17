-- Run once in Supabase SQL Editor

-- Allow 'dnf' (Did Not Finish) as a shelf status, alongside unread/reading/read
ALTER TABLE shelf DROP CONSTRAINT IF EXISTS shelf_status_check;
ALTER TABLE shelf ADD CONSTRAINT shelf_status_check
  CHECK (status IN ('unread', 'reading', 'read', 'dnf'));

-- Track whether this copy is physical or a Kindle/ebook — defaults to physical
ALTER TABLE shelf ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'physical'
  CHECK (format IN ('physical', 'virtual'));
