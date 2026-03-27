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
