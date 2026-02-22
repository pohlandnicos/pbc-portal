-- Bestehende offers Tabelle erweitern
alter table public.offers
  -- Texte
  add column intro_salutation text,
  add column intro_body_html text,
  add column outro_body_html text,
  -- Zahlungsbedingungen
  add column payment_due_days integer not null default 7,
  add column discount_percent numeric,
  add column discount_days integer,
  -- Steuer
  add column tax_rate numeric not null default 19,
  add column show_vat_for_labor boolean not null default false,
  -- Summen (ersetzt amount_cents)
  add column total_net numeric not null default 0,
  add column total_tax numeric not null default 0,
  add column total_gross numeric not null default 0;

-- Leistungsgruppen
create table public.offer_groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  
  index integer not null,
  title text not null,
  
  -- Zwischensummen
  material_cost numeric not null default 0,
  labor_cost numeric not null default 0,
  other_cost numeric not null default 0,
  material_margin numeric not null default 0,
  labor_margin numeric not null default 0,
  other_margin numeric not null default 0,
  total_net numeric not null default 0,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_offer_groups_updated_at
  before update on public.offer_groups
  for each row
  execute function public.set_updated_at();

create index offer_groups_org_id_idx on public.offer_groups(org_id);
create index offer_groups_offer_id_idx on public.offer_groups(offer_id);

-- Einzelpositionen
create table public.offer_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  offer_group_id uuid not null references public.offer_groups(id) on delete cascade,
  
  type text not null check (type in ('material', 'labor', 'other')),
  position_index text not null,
  
  name text not null,
  description text,
  
  qty numeric not null default 1,
  unit text not null default 'piece',
  
  purchase_price numeric not null default 0,
  markup_percent numeric not null default 0,
  margin_amount numeric not null default 0,
  unit_price numeric not null default 0,
  line_total numeric not null default 0,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_offer_items_updated_at
  before update on public.offer_items
  for each row
  execute function public.set_updated_at();

create index offer_items_org_id_idx on public.offer_items(org_id);
create index offer_items_offer_group_id_idx on public.offer_items(offer_group_id);

-- Textvorlagen
create table public.offer_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  
  type text not null check (type in ('intro', 'outro')),
  name text not null,
  salutation text,
  body_html text not null,
  is_default boolean not null default false,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Pro Org nur eine Default-Vorlage pro Typ
  unique (org_id, type) where is_default = true
);

create trigger trg_offer_templates_updated_at
  before update on public.offer_templates
  for each row
  execute function public.set_updated_at();

create index offer_templates_org_id_idx on public.offer_templates(org_id);

-- RLS Policies
alter table public.offer_groups enable row level security;
alter table public.offer_items enable row level security;
alter table public.offer_templates enable row level security;

-- Groups
create policy offer_groups_select on public.offer_groups
  for select to authenticated
  using (org_id in (select public.current_user_org_ids()));

create policy offer_groups_insert on public.offer_groups
  for insert to authenticated
  with check (org_id in (select public.current_user_org_ids()));

create policy offer_groups_update on public.offer_groups
  for update to authenticated
  using (org_id in (select public.current_user_org_ids()))
  with check (org_id in (select public.current_user_org_ids()));

create policy offer_groups_delete on public.offer_groups
  for delete to authenticated
  using (org_id in (select public.current_user_org_ids()));

-- Items
create policy offer_items_select on public.offer_items
  for select to authenticated
  using (org_id in (select public.current_user_org_ids()));

create policy offer_items_insert on public.offer_items
  for insert to authenticated
  with check (org_id in (select public.current_user_org_ids()));

create policy offer_items_update on public.offer_items
  for update to authenticated
  using (org_id in (select public.current_user_org_ids()))
  with check (org_id in (select public.current_user_org_ids()));

create policy offer_items_delete on public.offer_items
  for delete to authenticated
  using (org_id in (select public.current_user_org_ids()));

-- Templates
create policy offer_templates_select on public.offer_templates
  for select to authenticated
  using (org_id in (select public.current_user_org_ids()));

create policy offer_templates_insert on public.offer_templates
  for insert to authenticated
  with check (org_id in (select public.current_user_org_ids()));

create policy offer_templates_update on public.offer_templates
  for update to authenticated
  using (org_id in (select public.current_user_org_ids()))
  with check (org_id in (select public.current_user_org_ids()));

create policy offer_templates_delete on public.offer_templates
  for delete to authenticated
  using (org_id in (select public.current_user_org_ids()));

-- Default Templates
insert into public.offer_templates (
  org_id,
  type,
  name,
  salutation,
  body_html,
  is_default
)
select
  org.id as org_id,
  'intro' as type,
  'Standard' as name,
  'Sehr geehrte Damen und Herren,' as salutation,
  'Herzlichen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen hiermit folgendes Angebot:' as body_html,
  true as is_default
from public.organizations org;

insert into public.offer_templates (
  org_id,
  type,
  name,
  body_html,
  is_default
)
select
  org.id as org_id,
  'outro' as type,
  'Standard' as name,
  'Bitte beachten Sie, dass eventuell zusätzliche Kosten für unvorhergesehene Schäden oder zusätzliche Arbeiten anfallen können. Sollten während der Arbeiten unvorhergesehene Probleme auftreten, werden wir Sie umgehend informieren und mögliche Lösungen sowie die damit verbundenen Kosten mit Ihnen abstimmen.

Wir würden uns sehr freuen, wenn unser Angebot Ihre Zustimmung findet. Sie haben Fragen oder wünschen weitere Informationen? Rufen Sie uns an - wir sind für Sie da.' as body_html,
  true as is_default
from public.organizations org;
