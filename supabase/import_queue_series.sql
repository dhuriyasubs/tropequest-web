alter table import_queue
  add column if not exists series_name   text,
  add column if not exists series_number numeric(5,2);
