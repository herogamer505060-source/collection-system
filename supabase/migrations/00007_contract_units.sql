create table public.contract_units (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete restrict,
  unit_order integer,
  created_at timestamptz not null default timezone('utc', now()),
  constraint contract_units_unique_contract_unit unique (contract_id, unit_id)
);
