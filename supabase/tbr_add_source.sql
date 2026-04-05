-- Add source column to tbr to track where a book was added from
-- Run once in Supabase SQL Editor

ALTER TABLE tbr ADD COLUMN IF NOT EXISTS source TEXT;
