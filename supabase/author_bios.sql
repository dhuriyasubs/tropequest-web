create table if not exists author_bios (
  id          uuid primary key default gen_random_uuid(),
  author_name text unique not null,
  bio         jsonb,
  created_at  timestamptz default now()
);

-- Example insert:
-- insert into author_bios (author_name, bio) values (
--   'Ana Huang',
--   '{
--     "intro": "Ana Huang is a prominent voice in contemporary romance...",
--     "profile": {
--       "Primary Genres": "Steamy Contemporary Romance, Dark Romance, New Adult",
--       "Notable Works": "Twisted Love, King of Wrath, The Striker",
--       "Defining Tropes": "Forced Proximity, Billionaire Elite, Grumpy x Sunshine",
--       "Key Achievement": "Multi-week New York Times and Sunday Times bestseller"
--     },
--     "writing_style": "Huang'\''s work is characterized by a glossy aesthetic...",
--     "series": [
--       { "name": "The Twisted Series", "years": "2021", "description": "The breakout quartet featuring four best friends." },
--       { "name": "Kings of Sin Series", "years": "2022 to Present", "description": "A spinoff series focusing on an elite group of men." },
--       { "name": "Gods of the Game Series", "years": "2024 to Present", "description": "Her entry into the sports romance subgenre." }
--     ],
--     "reader_tip": "While her series can be read as standalones, they exist in a shared universe..."
--   }'
-- );
