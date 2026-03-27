create table public.installments (
  id uuid primary key default gen_random_uuid(),
  installment_key text not null unique,
  installment_code text,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  installment_type text not null,
  due_date date not null,
  amount_due numeric(18,2) not null,
  net_amount numeric(18,2),
  amount_collected numeric(18,2) not null default 0,
  amount_outstanding numeric(18,2) not null default 0,
  payment_status text not null,
  payment_date date,
  commercial_paper text,
  receipt_reference text,
  delay_days integer not null default 0,
  delay_bucket text not null default 'not_due',
  penalty_amount numeric(18,2) not null default 0,
  source_batch_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint installments_payment_status_check
    check (payment_status in ('paid', 'partial', 'unpaid', 'overdue')),
  constraint installments_delay_bucket_check
    check (delay_bucket in ('not_due', '1_30', '31_60', '61_90', '90_plus')),
  constraint installments_amount_due_nonnegative check (amount_due >= 0),
  constraint installments_net_amount_nonnegative check (net_amount is null or net_amount >= 0),
  constraint installments_amount_collected_nonnegative check (amount_collected >= 0),
  constraint installments_amount_outstanding_nonnegative check (amount_outstanding >= 0),
  constraint installments_delay_days_nonnegative check (delay_days >= 0),
  constraint installments_penalty_amount_nonnegative check (penalty_amount >= 0)
);

create trigger set_installments_updated_at
before update on public.installments
for each row
execute function public.set_updated_at();
