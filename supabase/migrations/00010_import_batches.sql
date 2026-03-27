create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_type text not null,
  status text not null default 'uploaded',
  created_by uuid not null references public.profiles (id) on delete restrict,
  started_at timestamptz not null default timezone('utc', now()),
  previewed_at timestamptz,
  finished_at timestamptz,
  rows_total integer not null default 0,
  rows_valid integer not null default 0,
  rows_imported integer not null default 0,
  rows_updated integer not null default 0,
  rows_skipped integer not null default 0,
  issue_count integer not null default 0,
  summary_json jsonb,
  error_log jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint import_batches_batch_type_check
    check (batch_type in ('installments', 'sold_units', 'available_units')),
  constraint import_batches_status_check
    check (status in ('uploaded', 'processing', 'ready_for_review', 'approved', 'approved_with_issues', 'rejected', 'failed')),
  constraint import_batches_rows_total_nonnegative check (rows_total >= 0),
  constraint import_batches_rows_valid_nonnegative check (rows_valid >= 0),
  constraint import_batches_rows_imported_nonnegative check (rows_imported >= 0),
  constraint import_batches_rows_updated_nonnegative check (rows_updated >= 0),
  constraint import_batches_rows_skipped_nonnegative check (rows_skipped >= 0),
  constraint import_batches_issue_count_nonnegative check (issue_count >= 0)
);

create trigger set_import_batches_updated_at
before update on public.import_batches
for each row
execute function public.set_updated_at();
