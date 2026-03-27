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
