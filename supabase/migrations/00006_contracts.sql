create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  contract_key text not null unique,
  contract_code text,
  customer_id uuid not null references public.customers (id) on delete restrict,
  project_id uuid not null references public.projects (id) on delete restrict,
  collector_user_id uuid references public.profiles (id) on delete set null,
  contract_notes text,
  delivery_date date,
  actual_delivery_date date,
  contract_status text not null default 'active',
  source_batch_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contracts_status_check
    check (contract_status in ('active', 'closed', 'cancelled', 'suspended'))
);

create trigger set_contracts_updated_at
before update on public.contracts
for each row
execute function public.set_updated_at();
