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
