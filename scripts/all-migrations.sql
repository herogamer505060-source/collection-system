-- ============================================================
-- Migration: 00001_projects.sql
-- ============================================================
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null unique,
  name_ar text not null,
  name_en text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_project_code_check
    check (project_code in ('parco', 'centro', 'caza'))
);

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

-- ============================================================
-- Migration: 00002_profiles_and_roles.sql
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  default_project_id uuid references public.projects (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  project_id uuid references public.projects (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_roles_role_check
    check (role in ('admin', 'manager', 'collector', 'viewer')),
  constraint user_roles_unique_assignment
    unique (user_id, role, project_id)
);

-- ============================================================
-- Migration: 00003_units.sql
-- ============================================================
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

-- ============================================================
-- Migration: 00004_customers.sql
-- ============================================================
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

-- ============================================================
-- Migration: 00005_customer_project_identities.sql
-- ============================================================
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

-- ============================================================
-- Migration: 00006_contracts.sql
-- ============================================================
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

-- ============================================================
-- Migration: 00007_contract_units.sql
-- ============================================================
create table public.contract_units (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete restrict,
  unit_order integer,
  created_at timestamptz not null default timezone('utc', now()),
  constraint contract_units_unique_contract_unit unique (contract_id, unit_id)
);

-- ============================================================
-- Migration: 00008_installments.sql
-- ============================================================
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

-- ============================================================
-- Migration: 00009_follow_ups.sql
-- ============================================================
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

-- ============================================================
-- Migration: 00010_import_batches.sql
-- ============================================================
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

-- ============================================================
-- Migration: 00011_import_files.sql
-- ============================================================
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

-- ============================================================
-- Migration: 00012_import_issues.sql
-- ============================================================
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

-- ============================================================
-- Migration: 00013_indexes.sql
-- ============================================================
alter table public.units
  add constraint units_source_batch_id_fkey
  foreign key (source_batch_id) references public.import_batches (id) on delete set null;

alter table public.contracts
  add constraint contracts_source_batch_id_fkey
  foreign key (source_batch_id) references public.import_batches (id) on delete set null;

alter table public.installments
  add constraint installments_source_batch_id_fkey
  foreign key (source_batch_id) references public.import_batches (id) on delete set null;

create index customers_normalized_name_idx on public.customers (normalized_name);
create unique index user_roles_unique_global_assignment_idx
  on public.user_roles (user_id, role)
  where project_id is null;
create index contracts_project_id_idx on public.contracts (project_id);
create index contracts_customer_id_idx on public.contracts (customer_id);
create index contracts_collector_user_id_idx on public.contracts (collector_user_id);
create unique index contracts_project_contract_code_idx
  on public.contracts (project_id, contract_code)
  where contract_code is not null;
create index installments_contract_due_date_idx on public.installments (contract_id, due_date);
create index installments_payment_status_due_date_idx on public.installments (payment_status, due_date);
create index installments_delay_bucket_idx on public.installments (delay_bucket);
create index follow_ups_customer_follow_up_date_idx on public.follow_ups (customer_id, follow_up_date);
create index follow_ups_collector_next_action_date_idx on public.follow_ups (collector_user_id, next_action_date);
create index import_issues_batch_severity_idx on public.import_issues (batch_id, severity);

-- ============================================================
-- Migration: 00014_rls_policies.sql
-- ============================================================
create or replace function public.has_role(target_role text, target_project_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles as user_role
    join public.profiles as profile
      on profile.id = user_role.user_id
    where user_role.user_id = auth.uid()
      and profile.is_active = true
      and user_role.role = target_role
      and (
        user_role.project_id is null
        or target_project_id is null
        or user_role.project_id = target_project_id
      )
  );
$$;

create or replace function public.can_read_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin')
    or public.has_role('manager', target_project_id)
    or public.has_role('viewer', target_project_id);
$$;

create or replace function public.can_access_contract(target_project_id uuid, target_collector_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_read_project(target_project_id)
    or (
      public.has_role('collector', target_project_id)
      and target_collector_user_id = auth.uid()
    );
$$;

create or replace function public.can_access_contract_id(target_contract_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contracts as contract_row
    where contract_row.id = target_contract_id
      and public.can_access_contract(contract_row.project_id, contract_row.collector_user_id)
  );
$$;

create or replace function public.can_access_customer(target_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin')
    or exists (
      select 1
      from public.contracts as contract_row
      where contract_row.customer_id = target_customer_id
        and public.can_access_contract(contract_row.project_id, contract_row.collector_user_id)
    );
$$;

create or replace function public.can_access_unit(target_unit_id uuid, target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_read_project(target_project_id)
    or exists (
      select 1
      from public.contract_units as contract_unit
      join public.contracts as contract_row
        on contract_row.id = contract_unit.contract_id
      where contract_unit.unit_id = target_unit_id
        and public.has_role('collector', contract_row.project_id)
        and contract_row.collector_user_id = auth.uid()
    );
$$;

create or replace function public.can_read_imports()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin')
    or public.has_role('manager')
    or public.has_role('viewer');
$$;

create or replace function public.can_manage_imports()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin')
    or public.has_role('manager');
$$;

create or replace function public.can_read_follow_up(
  target_customer_id uuid,
  target_contract_id uuid,
  target_created_by uuid,
  target_collector_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin')
    or public.can_access_customer(target_customer_id)
    or (target_contract_id is not null and public.can_access_contract_id(target_contract_id))
    or (
      public.has_role('collector')
      and (
        target_created_by = auth.uid()
        or target_collector_user_id = auth.uid()
      )
    );
$$;

create or replace function public.can_write_follow_up(
  target_customer_id uuid,
  target_contract_id uuid,
  target_created_by uuid,
  target_collector_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin')
    or public.has_role('manager')
    or (
      public.has_role('collector')
      and target_created_by = auth.uid()
      and (target_collector_user_id is null or target_collector_user_id = auth.uid())
      and (
        public.can_access_customer(target_customer_id)
        or (target_contract_id is not null and public.can_access_contract_id(target_contract_id))
      )
    );
$$;

alter table public.projects enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.units enable row level security;
alter table public.customers enable row level security;
alter table public.customer_project_identities enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_units enable row level security;
alter table public.installments enable row level security;
alter table public.follow_ups enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_files enable row level security;
alter table public.import_issues enable row level security;

create policy projects_select_authenticated
on public.projects
for select
to authenticated
using (true);

create policy profiles_select_authenticated
on public.profiles
for select
to authenticated
using (true);

create policy profiles_admin_manage
on public.profiles
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy user_roles_select_self_or_admin
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id or public.has_role('admin'));

create policy user_roles_admin_manage
on public.user_roles
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy units_select_by_scope
on public.units
for select
to authenticated
using (public.can_access_unit(id, project_id));

create policy customers_select_by_scope
on public.customers
for select
to authenticated
using (public.can_access_customer(id));

create policy customer_project_identities_select_by_scope
on public.customer_project_identities
for select
to authenticated
using (public.can_read_project(project_id));

create policy contracts_select_by_scope
on public.contracts
for select
to authenticated
using (public.can_access_contract(project_id, collector_user_id));

create policy contract_units_select_by_scope
on public.contract_units
for select
to authenticated
using (public.can_access_contract_id(contract_id));

create policy installments_select_by_scope
on public.installments
for select
to authenticated
using (public.can_access_contract_id(contract_id));

create policy follow_ups_select_by_scope
on public.follow_ups
for select
to authenticated
using (public.can_read_follow_up(customer_id, contract_id, created_by, collector_user_id));

create policy follow_ups_insert_by_scope
on public.follow_ups
for insert
to authenticated
with check (public.can_write_follow_up(customer_id, contract_id, created_by, collector_user_id));

create policy follow_ups_update_by_scope
on public.follow_ups
for update
to authenticated
using (public.can_write_follow_up(customer_id, contract_id, created_by, collector_user_id))
with check (public.can_write_follow_up(customer_id, contract_id, created_by, collector_user_id));

create policy import_batches_select_by_scope
on public.import_batches
for select
to authenticated
using (public.can_read_imports());

create policy import_batches_manage_by_scope
on public.import_batches
for all
to authenticated
using (public.can_manage_imports())
with check (public.can_manage_imports());

create policy import_files_select_by_scope
on public.import_files
for select
to authenticated
using (public.can_read_imports());

create policy import_files_manage_by_scope
on public.import_files
for all
to authenticated
using (public.can_manage_imports())
with check (public.can_manage_imports());

create policy import_issues_select_by_scope
on public.import_issues
for select
to authenticated
using (public.can_read_imports());

create policy import_issues_manage_by_scope
on public.import_issues
for all
to authenticated
using (public.can_manage_imports())
with check (public.can_manage_imports());

-- ============================================================
-- Migration: 00015_seed_projects.sql
-- ============================================================
insert into public.projects (id, project_code, name_ar, name_en)
values
  ('0a4c1ff1-5c14-4a66-9c16-6c8b9ce7a001', 'parco', 'إل باركو', 'IL Parco'),
  ('0a4c1ff1-5c14-4a66-9c16-6c8b9ce7a002', 'centro', 'إل سنترو', 'IL Centro'),
  ('0a4c1ff1-5c14-4a66-9c16-6c8b9ce7a003', 'caza', 'كازا', 'Caza')
on conflict (project_code) do update
set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  updated_at = timezone('utc', now());

