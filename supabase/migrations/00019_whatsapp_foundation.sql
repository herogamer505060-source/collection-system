alter table public.customers add column if not exists whatsapp_phone_normalized text;
alter table public.customers add column if not exists whatsapp_opted_out_at timestamptz;

create index if not exists idx_customers_whatsapp_phone_normalized
  on public.customers (whatsapp_phone_normalized)
  where whatsapp_phone_normalized is not null;

create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid null references public.projects (id) on delete cascade,
  template_name text not null,
  language_code text not null,
  category text not null check (category in ('marketing', 'utility', 'authentication')),
  approval_status text not null default 'draft' check (approval_status in ('draft', 'pending', 'approved', 'rejected', 'paused', 'disabled')),
  version integer not null default 1 check (version > 0),
  components_json jsonb not null default '{}'::jsonb,
  meta_template_id text,
  created_by uuid null references public.profiles (id) on delete set null,
  archived_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_whatsapp_templates_global_unique
  on public.whatsapp_templates (template_name, language_code, version)
  where project_id is null;

create unique index if not exists idx_whatsapp_templates_project_unique
  on public.whatsapp_templates (project_id, template_name, language_code, version)
  where project_id is not null;

create index if not exists idx_whatsapp_templates_approval_status
  on public.whatsapp_templates (approval_status);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  contract_id uuid null references public.contracts (id) on delete set null,
  installment_id uuid null references public.installments (id) on delete set null,
  follow_up_id uuid null references public.follow_ups (id) on delete set null,
  template_id uuid null references public.whatsapp_templates (id) on delete set null,
  direction text not null check (direction in ('outbound', 'inbound')),
  message_kind text not null check (message_kind in ('template', 'freeform', 'reply', 'status_only', 'unknown')),
  message_purpose text not null check (message_purpose in ('installment_due_7d', 'manual_follow_up', 'inbound_reply', 'system', 'other')),
  status text not null check (status in ('queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'received', 'ignored')),
  to_phone text null,
  to_phone_normalized text null,
  customer_wa_id text null,
  from_phone_number_id text null,
  meta_message_id text null,
  parent_message_id uuid null references public.whatsapp_messages (id) on delete set null,
  scheduled_for timestamptz null,
  sent_at timestamptz null,
  delivered_at timestamptz null,
  read_at timestamptz null,
  failed_at timestamptz null,
  received_at timestamptz null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz null,
  last_error_code text null,
  last_error_message text null,
  dedupe_key text null,
  template_params jsonb null,
  provider_request jsonb null,
  provider_response jsonb null,
  raw_message jsonb null,
  created_by uuid null references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_whatsapp_messages_meta_message_id
  on public.whatsapp_messages (meta_message_id)
  where meta_message_id is not null;

create unique index if not exists idx_whatsapp_messages_dedupe_key
  on public.whatsapp_messages (dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_whatsapp_messages_status_scheduled_for
  on public.whatsapp_messages (status, scheduled_for);

create index if not exists idx_whatsapp_messages_project_created_at
  on public.whatsapp_messages (project_id, created_at desc);

create index if not exists idx_whatsapp_messages_customer_created_at
  on public.whatsapp_messages (customer_id, created_at desc);

create index if not exists idx_whatsapp_messages_contract_created_at
  on public.whatsapp_messages (contract_id, created_at desc)
  where contract_id is not null;

create index if not exists idx_whatsapp_messages_installment_id
  on public.whatsapp_messages (installment_id)
  where installment_id is not null;

create table if not exists public.whatsapp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid null references public.projects (id) on delete set null,
  message_id uuid null references public.whatsapp_messages (id) on delete set null,
  event_type text not null check (event_type in ('message_status', 'inbound_message', 'template_status', 'unknown')),
  provider_event_key text not null,
  meta_message_id text null,
  customer_wa_id text null,
  payload jsonb not null,
  headers_json jsonb null,
  event_timestamp timestamptz null,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processed', 'ignored', 'failed')),
  processing_error text null,
  processed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_whatsapp_webhook_events_provider_event_key
  on public.whatsapp_webhook_events (provider_event_key);

create index if not exists idx_whatsapp_webhook_events_meta_message_id
  on public.whatsapp_webhook_events (meta_message_id)
  where meta_message_id is not null;

create index if not exists idx_whatsapp_webhook_events_processing_status
  on public.whatsapp_webhook_events (processing_status, created_at);

create index if not exists idx_whatsapp_webhook_events_customer_wa_id
  on public.whatsapp_webhook_events (customer_wa_id, created_at desc)
  where customer_wa_id is not null;

create trigger set_whatsapp_templates_updated_at
before update on public.whatsapp_templates
for each row execute function public.set_updated_at();

create trigger set_whatsapp_messages_updated_at
before update on public.whatsapp_messages
for each row execute function public.set_updated_at();

alter table public.whatsapp_templates enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.whatsapp_webhook_events enable row level security;
