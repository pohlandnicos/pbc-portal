-- user profile settings per org

create table if not exists public.user_profiles (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,

  first_name text,
  last_name text,
  avatar_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (org_id, user_id)
);

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

create policy user_profiles_select
on public.user_profiles
for select
using (
  org_id in (select public.current_user_org_ids())
  and user_id = auth.uid()
);

create policy user_profiles_insert
on public.user_profiles
for insert
with check (
  org_id in (select public.current_user_org_ids())
  and user_id = auth.uid()
);

create policy user_profiles_update
on public.user_profiles
for update
using (
  org_id in (select public.current_user_org_ids())
  and user_id = auth.uid()
)
with check (
  org_id in (select public.current_user_org_ids())
  and user_id = auth.uid()
);
