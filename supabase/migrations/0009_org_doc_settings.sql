-- org-level settings for offer/invoice + text/layout + storage bucket/policies

-- enums
create type public.payment_scope as enum ('invoice', 'both');
create type public.logo_position as enum ('left', 'right');
create type public.logo_size as enum ('small', 'medium', 'large');

-- offer/invoice settings
create table if not exists public.org_offer_invoice_settings (
  org_id uuid primary key references public.organizations(id) on delete cascade,

  offer_prefix text not null default 'A-',
  offer_next_number integer not null default 1,

  invoice_prefix text not null default 'R-',
  invoice_next_number integer not null default 1,

  auto_customer_number boolean not null default false,

  payment_due_days integer not null default 7,
  payment_scope public.payment_scope not null default 'both',

  labor_note_offer_private boolean not null default true,
  labor_note_offer_business boolean not null default true,
  labor_note_invoice_private boolean not null default true,
  labor_note_invoice_business boolean not null default true,

  agb_pdf_path text,
  withdrawal_pdf_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_org_offer_invoice_settings_updated_at
before update on public.org_offer_invoice_settings
for each row execute function public.set_updated_at();

alter table public.org_offer_invoice_settings enable row level security;

create policy org_offer_invoice_settings_select
on public.org_offer_invoice_settings
for select
using (org_id in (select public.current_user_org_ids()));

create policy org_offer_invoice_settings_insert
on public.org_offer_invoice_settings
for insert
with check (org_id in (select public.current_user_org_ids()));

create policy org_offer_invoice_settings_update
on public.org_offer_invoice_settings
for update
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

-- text/layout settings
create table if not exists public.org_text_layout_settings (
  org_id uuid primary key references public.organizations(id) on delete cascade,

  logo_enabled boolean not null default true,
  logo_path text,
  logo_position public.logo_position not null default 'right',
  logo_size public.logo_size not null default 'small',

  sender_line_enabled boolean not null default true,

  footer_enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_org_text_layout_settings_updated_at
before update on public.org_text_layout_settings
for each row execute function public.set_updated_at();

alter table public.org_text_layout_settings enable row level security;

create policy org_text_layout_settings_select
on public.org_text_layout_settings
for select
using (org_id in (select public.current_user_org_ids()));

create policy org_text_layout_settings_insert
on public.org_text_layout_settings
for insert
with check (org_id in (select public.current_user_org_ids()));

create policy org_text_layout_settings_update
on public.org_text_layout_settings
for update
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

-- storage bucket for org documents (AGB, Widerruf, Logos)
insert into storage.buckets (id, name, public)
values ('org-docs', 'org-docs', false)
on conflict (id) do nothing;

-- RLS policies for storage objects in bucket org-docs
create policy org_docs_select
on storage.objects
for select
using (
  bucket_id = 'org-docs'
  and exists (
    select 1
    from public.org_members om
    where om.user_id = auth.uid()
      and om.org_id = (storage.foldername(name))[1]::uuid
  )
);

create policy org_docs_insert
on storage.objects
for insert
with check (
  bucket_id = 'org-docs'
  and exists (
    select 1
    from public.org_members om
    where om.user_id = auth.uid()
      and om.org_id = (storage.foldername(name))[1]::uuid
  )
);

create policy org_docs_update
on storage.objects
for update
using (
  bucket_id = 'org-docs'
  and exists (
    select 1
    from public.org_members om
    where om.user_id = auth.uid()
      and om.org_id = (storage.foldername(name))[1]::uuid
  )
)
with check (
  bucket_id = 'org-docs'
  and exists (
    select 1
    from public.org_members om
    where om.user_id = auth.uid()
      and om.org_id = (storage.foldername(name))[1]::uuid
  )
);

create policy org_docs_delete
on storage.objects
for delete
using (
  bucket_id = 'org-docs'
  and exists (
    select 1
    from public.org_members om
    where om.user_id = auth.uid()
      and om.org_id = (storage.foldername(name))[1]::uuid
  )
);
