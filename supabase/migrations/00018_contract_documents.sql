create table public.contract_documents (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  content_type text not null default 'application/pdf',
  file_size_bytes bigint not null,
  document_type text not null default 'contract',
  notes text,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contract_documents_document_type_check check (document_type in ('contract', 'amendment', 'receipt', 'other')),
  constraint contract_documents_file_size_positive check (file_size_bytes > 0)
);

create trigger set_contract_documents_updated_at
before update on public.contract_documents
for each row execute function public.set_updated_at();

create index idx_contract_documents_contract_id on public.contract_documents (contract_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contract-documents',
  'contract-documents',
  false,
  20971520,
  array['application/pdf']
)
on conflict (id) do nothing;
