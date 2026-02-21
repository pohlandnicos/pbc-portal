create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select om.org_id
  from public.org_members om
  where om.user_id = auth.uid()
$$;

create or replace function public.is_org_admin(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.org_members om
    where om.org_id = p_org_id
      and om.user_id = auth.uid()
      and om.role in ('owner','admin')
  );
$$;
