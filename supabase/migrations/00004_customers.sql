create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null unique,
  customer_name text not null,
  normalized_name text not null,
  customer_name_raw text,
  mobile text,
  email text,
  national_id text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();
