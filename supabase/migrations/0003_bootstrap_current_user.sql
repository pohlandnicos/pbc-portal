create or replace function public.bootstrap_current_user_org(p_org_name text default 'Default')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_uid::text));

  select om.org_id into v_org_id
  from public.org_members om
  where om.user_id = v_uid
  limit 1;

  if v_org_id is not null then
    return v_org_id;
  end if;

  insert into public.organizations (name)
  values (p_org_name)
  returning id into v_org_id;

  insert into public.org_members (org_id, user_id, role)
  values (v_org_id, v_uid, 'owner');

  return v_org_id;
end;
$$;

grant execute on function public.bootstrap_current_user_org(text) to authenticated;
