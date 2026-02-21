-- pbc portal initial schema + RLS

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.customer_type as enum ('private', 'company');
create type public.member_role as enum ('owner', 'admin', 'member');
create type public.doc_kind as enum ('generic', 'offer', 'invoice', 'protocol', 'report', 'photo');
create type public.offer_status as enum ('draft', 'sent', 'accepted', 'rejected', 'cancelled');
create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type public.project_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type public.task_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type public.protocol_type as enum ('leakage', 'inspection', 'electricity');
create type public.mail_provider as enum ('microsoft');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create trigger trg_org_members_updated_at
before update on public.org_members
for each row execute function public.set_updated_at();

create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
as $$
  select om.org_id
  from public.org_members om
  where om.user_id = auth.uid()
$$;

create or replace function public.is_org_admin(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_members om
    where om.org_id = p_org_id
      and om.user_id = auth.uid()
      and om.role in ('owner','admin')
  );
$$;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  type public.customer_type not null,

  company_name text,
  salutation text,
  first_name text,
  last_name text,

  description text,
  customer_number text,
  leitweg_id text,
  supplier_number text,
  vendor_number text,
  vat_id text,

  billing_street text not null,
  billing_house_number text not null,
  billing_address_extra text,
  billing_postal_code text not null,
  billing_city text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customers_name_required check (
    (type = 'company' and company_name is not null and length(trim(company_name)) > 0)
    or
    (type = 'private'
      and salutation is not null and length(trim(salutation)) > 0
      and first_name is not null and length(trim(first_name)) > 0
      and last_name is not null and length(trim(last_name)) > 0
    )
  )
);

create index customers_org_id_idx on public.customers(org_id);
create index customers_customer_number_idx on public.customers(org_id, customer_number);

create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create table public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,

  contact_name text,
  phone_landline text,
  phone_mobile text,
  email text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_contacts_org_id_idx on public.customer_contacts(org_id);
create index customer_contacts_customer_id_idx on public.customer_contacts(customer_id);

create trigger trg_customer_contacts_updated_at
before update on public.customer_contacts
for each row execute function public.set_updated_at();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,

  title text not null,
  project_number text,
  received_at date not null,
  description text,
  status public.project_status not null default 'open',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (org_id, project_number)
);

create index projects_org_id_idx on public.projects(org_id);
create index projects_customer_id_idx on public.projects(customer_id);

create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create table public.project_locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,

  is_billing_address boolean not null default false,

  street text not null,
  house_number text not null,
  address_extra text,
  postal_code text not null,
  city text not null,

  contact_name text,
  phone_landline text,
  phone_mobile text,
  email text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_locations_org_id_idx on public.project_locations(org_id);
create index project_locations_project_id_idx on public.project_locations(project_id);

create trigger trg_project_locations_updated_at
before update on public.project_locations
for each row execute function public.set_updated_at();

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,

  offer_date date not null,
  offer_number text,
  name text not null,
  status public.offer_status not null default 'draft',
  amount_cents bigint,
  currency text not null default 'EUR',
  execution_city text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (org_id, offer_number)
);

create index offers_org_id_idx on public.offers(org_id);
create index offers_customer_id_idx on public.offers(customer_id);
create index offers_project_id_idx on public.offers(project_id);

create trigger trg_offers_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,

  invoice_date date not null,
  invoice_number text,
  name text not null,
  status public.invoice_status not null default 'draft',
  amount_cents bigint,
  currency text not null default 'EUR',
  execution_city text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (org_id, invoice_number)
);

create index invoices_org_id_idx on public.invoices(org_id);
create index invoices_customer_id_idx on public.invoices(customer_id);
create index invoices_project_id_idx on public.invoices(project_id);
create index invoices_offer_id_idx on public.invoices(offer_id);

create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  kind public.doc_kind not null default 'generic',
  title text,
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  original_name text,

  customer_id uuid references public.customers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_org_id_idx on public.documents(org_id);
create index documents_customer_id_idx on public.documents(customer_id);
create index documents_project_id_idx on public.documents(project_id);
create index documents_offer_id_idx on public.documents(offer_id);
create index documents_invoice_id_idx on public.documents(invoice_id);

create trigger trg_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  type public.protocol_type not null,
  title text not null,
  protocol_date date not null default current_date,

  customer_id uuid references public.customers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,

  content jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index protocols_org_id_idx on public.protocols(org_id);
create index protocols_project_id_idx on public.protocols(project_id);
create index protocols_customer_id_idx on public.protocols(customer_id);

create trigger trg_protocols_updated_at
before update on public.protocols
for each row execute function public.set_updated_at();

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  title text not null,
  description text,
  status public.task_status not null default 'open',
  due_at timestamptz,

  customer_id uuid references public.customers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,

  created_by uuid not null default auth.uid(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_org_id_idx on public.tasks(org_id);
create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_customer_id_idx on public.tasks(customer_id);

create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create table public.mail_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  provider public.mail_provider not null default 'microsoft',
  owner_user_id uuid not null,

  external_account_id text,
  tenant_id text,

  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mail_accounts_org_id_idx on public.mail_accounts(org_id);
create index mail_accounts_owner_user_id_idx on public.mail_accounts(owner_user_id);

create trigger trg_mail_accounts_updated_at
before update on public.mail_accounts
for each row execute function public.set_updated_at();

create table public.mail_threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  mail_account_id uuid not null references public.mail_accounts(id) on delete cascade,

  external_thread_id text,
  subject text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mail_threads_org_id_idx on public.mail_threads(org_id);
create index mail_threads_mail_account_id_idx on public.mail_threads(mail_account_id);

create trigger trg_mail_threads_updated_at
before update on public.mail_threads
for each row execute function public.set_updated_at();

create table public.mail_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  mail_account_id uuid not null references public.mail_accounts(id) on delete cascade,
  thread_id uuid references public.mail_threads(id) on delete set null,

  external_message_id text,
  sent_at timestamptz,
  direction text,

  from_email text,
  to_emails text[],
  cc_emails text[],

  subject text,
  body_preview text,
  body_text text,

  customer_id uuid references public.customers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mail_messages_org_id_idx on public.mail_messages(org_id);
create index mail_messages_mail_account_id_idx on public.mail_messages(mail_account_id);
create index mail_messages_thread_id_idx on public.mail_messages(thread_id);

create trigger trg_mail_messages_updated_at
before update on public.mail_messages
for each row execute function public.set_updated_at();

create table public.mail_attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  mail_message_id uuid not null references public.mail_messages(id) on delete cascade,

  filename text,
  mime_type text,
  size_bytes bigint,

  storage_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mail_attachments_org_id_idx on public.mail_attachments(org_id);
create index mail_attachments_message_id_idx on public.mail_attachments(mail_message_id);

create trigger trg_mail_attachments_updated_at
before update on public.mail_attachments
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.customers enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.projects enable row level security;
alter table public.project_locations enable row level security;
alter table public.offers enable row level security;
alter table public.invoices enable row level security;
alter table public.documents enable row level security;
alter table public.protocols enable row level security;
alter table public.tasks enable row level security;
alter table public.mail_accounts enable row level security;
alter table public.mail_threads enable row level security;
alter table public.mail_messages enable row level security;
alter table public.mail_attachments enable row level security;

create policy organizations_select on public.organizations
for select
to authenticated
using (id in (select public.current_user_org_ids()));

create policy organizations_insert on public.organizations
for insert
to authenticated
with check (true);

create policy organizations_update on public.organizations
for update
to authenticated
using (public.is_org_admin(id))
with check (public.is_org_admin(id));

create policy organizations_delete on public.organizations
for delete
to authenticated
using (public.is_org_admin(id));

create policy org_members_select on public.org_members
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy org_members_insert on public.org_members
for insert
to authenticated
with check (public.is_org_admin(org_id));

create policy org_members_update on public.org_members
for update
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

create policy org_members_delete on public.org_members
for delete
to authenticated
using (public.is_org_admin(org_id));

create policy customers_select on public.customers
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy customers_insert on public.customers
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy customers_update on public.customers
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy customers_delete on public.customers
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy customer_contacts_select on public.customer_contacts
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy customer_contacts_insert on public.customer_contacts
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy customer_contacts_update on public.customer_contacts
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy customer_contacts_delete on public.customer_contacts
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy projects_select on public.projects
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy projects_insert on public.projects
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy projects_update on public.projects
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy projects_delete on public.projects
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy project_locations_select on public.project_locations
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy project_locations_insert on public.project_locations
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy project_locations_update on public.project_locations
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy project_locations_delete on public.project_locations
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy offers_select on public.offers
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy offers_insert on public.offers
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy offers_update on public.offers
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy offers_delete on public.offers
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy invoices_select on public.invoices
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy invoices_insert on public.invoices
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy invoices_update on public.invoices
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy invoices_delete on public.invoices
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy documents_select on public.documents
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy documents_insert on public.documents
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy documents_update on public.documents
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy documents_delete on public.documents
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy protocols_select on public.protocols
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy protocols_insert on public.protocols
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy protocols_update on public.protocols
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy protocols_delete on public.protocols
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy tasks_select on public.tasks
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy tasks_insert on public.tasks
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy tasks_update on public.tasks
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy tasks_delete on public.tasks
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy mail_accounts_select on public.mail_accounts
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy mail_accounts_insert on public.mail_accounts
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy mail_accounts_update on public.mail_accounts
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy mail_accounts_delete on public.mail_accounts
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy mail_threads_select on public.mail_threads
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy mail_threads_insert on public.mail_threads
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy mail_threads_update on public.mail_threads
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy mail_threads_delete on public.mail_threads
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy mail_messages_select on public.mail_messages
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy mail_messages_insert on public.mail_messages
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy mail_messages_update on public.mail_messages
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy mail_messages_delete on public.mail_messages
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy mail_attachments_select on public.mail_attachments
for select
to authenticated
using (org_id in (select public.current_user_org_ids()));

create policy mail_attachments_insert on public.mail_attachments
for insert
to authenticated
with check (org_id in (select public.current_user_org_ids()));

create policy mail_attachments_update on public.mail_attachments
for update
to authenticated
using (org_id in (select public.current_user_org_ids()))
with check (org_id in (select public.current_user_org_ids()));

create policy mail_attachments_delete on public.mail_attachments
for delete
to authenticated
using (org_id in (select public.current_user_org_ids()));
