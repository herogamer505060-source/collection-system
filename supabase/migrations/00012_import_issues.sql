create table public.import_issues (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches (id) on delete cascade,
  import_file_id uuid references public.import_files (id) on delete set null,
  severity text not null,
  issue_type text not null,
  raw_value text,
  message_ar text not null,
  source_row_number integer,
  payload jsonb,
  resolved boolean not null default false,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint import_issues_severity_check
    check (severity in ('high', 'medium', 'low'))
);
