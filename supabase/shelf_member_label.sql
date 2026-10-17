-- Run once in Supabase SQL Editor

-- Free-text label for whose physical/virtual copy a shelf entry is
-- (e.g. "Husband") — null means it's the account owner's own copy.
ALTER TABLE shelf ADD COLUMN IF NOT EXISTS member_label TEXT;
