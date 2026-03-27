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
