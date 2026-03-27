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
