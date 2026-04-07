create table if not exists author_bios (
  author_name text primary key,
  bio         text,
  created_at  timestamptz default now()
);
