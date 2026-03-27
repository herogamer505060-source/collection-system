create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, is_active)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    true
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role, project_id)
  select new.id, 'viewer', null
  where not exists (
    select 1 from public.user_roles
    where user_id = new.id and role = 'viewer' and project_id is null
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
