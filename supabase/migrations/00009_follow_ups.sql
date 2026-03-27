create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts (id) on delete set null,
  customer_id uuid not null references public.customers (id) on delete restrict,
  follow_up_date timestamptz not null,
  contact_type text not null,
  note text not null,
  customer_response text,
  promised_to_pay boolean not null default false,
  promise_date date,
  next_action_date date,
  collector_user_id uuid references public.profiles (id) on delete set null,
  follow_up_status text not null default 'open',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint follow_ups_contact_type_check
    check (contact_type in ('call', 'whatsapp', 'meeting', 'email', 'other')),
  constraint follow_ups_status_check
    check (follow_up_status in ('open', 'done', 'missed'))
);

create trigger set_follow_ups_updated_at
before update on public.follow_ups
for each row
execute function public.set_updated_at();
