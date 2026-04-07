create table if not exists series_bios (
  id          uuid primary key default gen_random_uuid(),
  series_name text unique not null,
  bio         jsonb,
  created_at  timestamptz default now()
);

-- bio jsonb shape:
-- {
--   "intro": "text",
--   "reading_order_note": "optional note above the table",
--   "reading_order": [
--     { "number": 1, "format": "Novel", "focus": "The introduction to Prythian and the Spring Court." },
--     { "number": 2, "format": "Novel", "focus": "Widely considered the series favourite; focuses on the Night Court." }
--   ],
--   "what_to_expect": [
--     { "label": "The World Building", "text": "Prythian is divided into Seven Courts..." },
--     { "label": "The Romance", "text": "The series is famous for its slow burn tension..." }
--   ],
--   "reading_tip": "Do not skip the novella..."
-- }
