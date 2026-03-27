create table public.units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  unit_key text not null unique,
  unit_code text not null,
  floor_name text,
  built_up_area numeric(12,2),
  garden_area numeric(12,2),
  other_area numeric(12,2),
  list_price numeric(18,2),
  contract_price numeric(18,2),
  unit_status text not null,
  source_sold boolean not null default false,
  source_available boolean not null default false,
  status_conflict boolean not null default false,
  source_batch_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint units_project_unit_code_unique unique (project_id, unit_code),
  constraint units_status_check check (unit_status in ('sold', 'available'))
);

create trigger set_units_updated_at
before update on public.units
for each row
execute function public.set_updated_at();
