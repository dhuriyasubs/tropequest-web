-- Add ISBN columns to books table
alter table books
  add column if not exists isbn   text,
  add column if not exists isbn13 text;

-- Unique indexes (partial — only where value is non-null)
create unique index if not exists books_isbn_idx
  on books (isbn)
  where isbn is not null and isbn != '';

create unique index if not exists books_isbn13_idx
  on books (isbn13)
  where isbn13 is not null and isbn13 != '';
