create table public.import_files (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  source_type text not null,
  sheet_name text,
  header_row_number integer,
  detected_columns jsonb,
  raw_rows_count integer not null default 0,
  valid_rows_count integer not null default 0,
  rejected_rows_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint import_files_source_type_check
    check (source_type in ('installments_report', 'sold_units_report', 'available_units_report')),
  constraint import_files_raw_rows_count_nonnegative check (raw_rows_count >= 0),
  constraint import_files_valid_rows_count_nonnegative check (valid_rows_count >= 0),
  constraint import_files_rejected_rows_count_nonnegative check (rejected_rows_count >= 0)
);
