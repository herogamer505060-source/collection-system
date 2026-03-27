create table public.customer_project_identities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  customer_import_key text not null unique,
  normalized_name text not null,
  customer_name_raw text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_project_identities_unique_name_per_project
    unique (project_id, normalized_name)
);

create trigger set_customer_project_identities_updated_at
before update on public.customer_project_identities
for each row
execute function public.set_updated_at();
