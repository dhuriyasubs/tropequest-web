-- Goodreads import queue
-- Books from CSV that didn't match anything in the books table.
-- The Python pipeline polls this table, enriches via Open Library / Google Books,
-- then inserts into books and sets status = 'done'.

create table if not exists import_queue (
  id            bigserial primary key,
  title         text      not null,
  author        text,
  isbn          text,
  isbn13        text,
  gr_rating     numeric(3,2),   -- Goodreads average rating from CSV
  status        text      not null default 'pending'
                check (status in ('pending', 'processing', 'done', 'failed')),
  created_at    timestamptz not null default now(),
  processed_at  timestamptz,
  book_id       bigint references books(id) on delete set null  -- set once enriched
);

-- Deduplicate on ISBN13 when present
create unique index if not exists import_queue_isbn13_idx
  on import_queue (isbn13)
  where isbn13 is not null and isbn13 != '';

-- For polling by the pipeline
create index if not exists import_queue_status_idx on import_queue (status)
  where status = 'pending';

-- RLS: only service role (pipeline) writes; no user-facing reads needed
alter table import_queue enable row level security;
