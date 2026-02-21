-- pbc portal initial schema + RLS

create extension if not exists pgcrypto;

-- Enums
create type customer_type as enum ('private', 'company');
create type offer_status as enum ('draft', 'sent', 'accepted', 'rejected', 'cancelled');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type task_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type mail_provider as enum ('microsoft');
create type project_location_mode as enum ('billing_address', 'custom');

-- Timestamps
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Security helpers
create or replace function is_org_member(org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function prevent_org_id_change()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id is immutable';
  end if;
  return new;
end;
$$;

-- Core tables
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function set_updated_at();

create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index org_members_user_id_idx on public.org_members(user_id);
create index org_members_org_id_idx on public.org_members(organization_id);

create trigger org_members_set_updated_at
before update on public.org_members
for each row execute function set_updated_at();

-- Customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type customer_type not null,

  company_name text,
  salutation text,
  first_name text,
  last_name text,

  billing_street text not null,
  billing_house_number text not null,
  billing_address_extra text,
  billing_postal_code text not null,
  billing_city text not null,

  description text,
  customer_number text,
  leitweg_id text,
  supplier_number text,
  vat_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customers_name_check check (
    (type = 'company' and company_name is not null) or
    (type = 'private' and first_name is not null and last_name is not null)
  )
);

create index customers_org_id_idx on public.customers(organization_id);
create index customers_customer_number_idx on public.customers(organization_id, customer_number);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function set_updated_at();

create trigger customers_prevent_org_change
before update on public.customers
for each row execute function prevent_org_id_change();

create table public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,

  name text,
  email text,
  phone text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_contacts_org_id_idx on public.customer_contacts(organization_id);
create index customer_contacts_customer_id_idx on public.customer_contacts(customer_id);

create trigger customer_contacts_set_updated_at
before update on public.customer_contacts
for each row execute function set_updated_at();

create trigger customer_contacts_prevent_org_change
before update on public.customer_contacts
for each row execute function prevent_org_id_change();

-- Projects
create table public.project_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  street text not null,
  house_number text not null,
  address_extra text,
  postal_code text not null,
  city text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_locations_org_id_idx on public.project_locations(organization_id);

create trigger project_locations_set_updated_at
before update on public.project_locations
for each row execute function set_updated_at();

create trigger project_locations_prevent_org_change
before update on public.project_locations
for each row execute function prevent_org_id_change();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,

  title text not null,
  received_at date not null,
  description text,

  execution_location_mode project_location_mode not null default 'billing_address',
  execution_location_id uuid references public.project_locations(id) on delete set null,

  contact_name text,
  contact_email text,
  contact_phone text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint projects_location_check check (
    (execution_location_mode = 'billing_address' and execution_location_id is null) or
    (execution_location_mode = 'custom' and execution_location_id is not null)
  )
);

create index projects_org_id_idx on public.projects(organization_id);
create index projects_customer_id_idx on public.projects(customer_id);

create trigger projects_set_updated_at
before update on public.projects
for each row execute function set_updated_at();

create trigger projects_prevent_org_change
before update on public.projects
for each row execute function prevent_org_id_change();

-- Offers
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,

  offer_date date not null,
  number text not null,
  status offer_status not null default 'draft',
  name text not null,
  amount_cents bigint not null,
  currency char(3) not null default 'EUR',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);

create index offers_org_id_idx on public.offers(organization_id);
create index offers_customer_id_idx on public.offers(customer_id);
create index offers_project_id_idx on public.offers(project_id);

create trigger offers_set_updated_at
before update on public.offers
for each row execute function set_updated_at();

create trigger offers_prevent_org_change
before update on public.offers
for each row execute function prevent_org_id_change();

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,

  invoice_date date not null,
  number text not null,
  status invoice_status not null default 'draft',
  name text not null,
  amount_cents bigint not null,
  currency char(3) not null default 'EUR',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);

create index invoices_org_id_idx on public.invoices(organization_id);
create index invoices_customer_id_idx on public.invoices(customer_id);
create index invoices_project_id_idx on public.invoices(project_id);

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function set_updated_at();

create trigger invoices_prevent_org_change
before update on public.invoices
for each row execute function prevent_org_id_change();

-- Documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  customer_id uuid references public.customers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,

  file_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  original_name text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_org_id_idx on public.documents(organization_id);
create index documents_customer_id_idx on public.documents(customer_id);
create index documents_project_id_idx on public.documents(project_id);
create index documents_offer_id_idx on public.documents(offer_id);
create index documents_invoice_id_idx on public.documents(invoice_id);

create trigger documents_set_updated_at
before update on public.documents
for each row execute function set_updated_at();

create trigger documents_prevent_org_change
before update on public.documents
for each row execute function prevent_org_id_change();

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  title text not null,
  status task_status not null default 'open',
  due_date date,
  assigned_to_user_id uuid references auth.users(id) on delete set null,

  customer_id uuid references public.customers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_org_id_idx on public.tasks(organization_id);
create index tasks_assigned_to_user_id_idx on public.tasks(assigned_to_user_id);

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function set_updated_at();

create trigger tasks_prevent_org_change
before update on public.tasks
for each row execute function prevent_org_id_change();

-- Protocols
create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  title text not null,
  protocol_date date not null default (now()::date),
  content text,

  customer_id uuid references public.customers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index protocols_org_id_idx on public.protocols(organization_id);

create trigger protocols_set_updated_at
before update on public.protocols
for each row execute function set_updated_at();

create trigger protocols_prevent_org_change
before update on public.protocols
for each row execute function prevent_org_id_change();

-- Mail (placeholder sync base)
create table public.mail_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  provider mail_provider not null default 'microsoft',
  email text not null,
  external_account_id text,

  token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, email)
);

create index mail_accounts_org_id_idx on public.mail_accounts(organization_id);
create index mail_accounts_user_id_idx on public.mail_accounts(user_id);

create trigger mail_accounts_set_updated_at
before update on public.mail_accounts
for each row execute function set_updated_at();

create trigger mail_accounts_prevent_org_change
before update on public.mail_accounts
for each row execute function prevent_org_id_change();

create table public.mail_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mail_account_id uuid not null references public.mail_accounts(id) on delete cascade,

  external_thread_id text not null,
  subject text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mail_account_id, external_thread_id)
);

create index mail_threads_org_id_idx on public.mail_threads(organization_id);

create trigger mail_threads_set_updated_at
before update on public.mail_threads
for each row execute function set_updated_at();

create trigger mail_threads_prevent_org_change
before update on public.mail_threads
for each row execute function prevent_org_id_change();

create table public.mail_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mail_account_id uuid not null references public.mail_accounts(id) on delete cascade,
  mail_thread_id uuid references public.mail_threads(id) on delete set null,

  external_message_id text not null,
  from_email text,
  to_emails text[],
  cc_emails text[],
  bcc_emails text[],
  subject text,
  body_preview text,
  sent_at timestamptz,
  received_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mail_account_id, external_message_id)
);

create index mail_messages_org_id_idx on public.mail_messages(organization_id);

create trigger mail_messages_set_updated_at
before update on public.mail_messages
for each row execute function set_updated_at();

create trigger mail_messages_prevent_org_change
before update on public.mail_messages
for each row execute function prevent_org_id_change();

create table public.mail_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mail_account_id uuid not null references public.mail_accounts(id) on delete cascade,
  mail_message_id uuid not null references public.mail_messages(id) on delete cascade,

  external_attachment_id text,
  file_name text not null,
  mime_type text,
  size_bytes bigint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mail_attachments_org_id_idx on public.mail_attachments(organization_id);

create trigger mail_attachments_set_updated_at
before update on public.mail_attachments
for each row execute function set_updated_at();

create trigger mail_attachments_prevent_org_change
before update on public.mail_attachments
for each row execute function prevent_org_id_change();

-- RLS
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.customers enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.projects enable row level security;
alter table public.project_locations enable row level security;
alter table public.offers enable row level security;
alter table public.invoices enable row level security;
alter table public.documents enable row level security;
alter table public.tasks enable row level security;
alter table public.protocols enable row level security;
alter table public.mail_accounts enable row level security;
alter table public.mail_threads enable row level security;
alter table public.mail_messages enable row level security;
alter table public.mail_attachments enable row level security;

-- Policies (Multi-tenant via org_members + auth.uid())

-- organizations
create policy "org_select" on public.organizations
for select
to authenticated
using (is_org_member(id));

create policy "org_update" on public.organizations
for update
to authenticated
using (is_org_member(id))
with check (is_org_member(id));

-- org_members
create policy "org_members_select" on public.org_members
for select
to authenticated
using (is_org_member(organization_id));

create policy "org_members_insert" on public.org_members
for insert
to authenticated
with check (is_org_member(organization_id));

create policy "org_members_update" on public.org_members
for update
to authenticated
using (is_org_member(organization_id))
with check (is_org_member(organization_id));

create policy "org_members_delete" on public.org_members
for delete
to authenticated
using (is_org_member(organization_id));

-- Generic policies for org-scoped tables
create policy "customers_select" on public.customers for select to authenticated using (is_org_member(organization_id));
create policy "customers_insert" on public.customers for insert to authenticated with check (is_org_member(organization_id));
create policy "customers_update" on public.customers for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "customers_delete" on public.customers for delete to authenticated using (is_org_member(organization_id));

create policy "customer_contacts_select" on public.customer_contacts for select to authenticated using (is_org_member(organization_id));
create policy "customer_contacts_insert" on public.customer_contacts for insert to authenticated with check (is_org_member(organization_id));
create policy "customer_contacts_update" on public.customer_contacts for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "customer_contacts_delete" on public.customer_contacts for delete to authenticated using (is_org_member(organization_id));

create policy "project_locations_select" on public.project_locations for select to authenticated using (is_org_member(organization_id));
create policy "project_locations_insert" on public.project_locations for insert to authenticated with check (is_org_member(organization_id));
create policy "project_locations_update" on public.project_locations for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "project_locations_delete" on public.project_locations for delete to authenticated using (is_org_member(organization_id));

create policy "projects_select" on public.projects for select to authenticated using (is_org_member(organization_id));
create policy "projects_insert" on public.projects for insert to authenticated with check (is_org_member(organization_id));
create policy "projects_update" on public.projects for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "projects_delete" on public.projects for delete to authenticated using (is_org_member(organization_id));

create policy "offers_select" on public.offers for select to authenticated using (is_org_member(organization_id));
create policy "offers_insert" on public.offers for insert to authenticated with check (is_org_member(organization_id));
create policy "offers_update" on public.offers for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "offers_delete" on public.offers for delete to authenticated using (is_org_member(organization_id));

create policy "invoices_select" on public.invoices for select to authenticated using (is_org_member(organization_id));
create policy "invoices_insert" on public.invoices for insert to authenticated with check (is_org_member(organization_id));
create policy "invoices_update" on public.invoices for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "invoices_delete" on public.invoices for delete to authenticated using (is_org_member(organization_id));

create policy "documents_select" on public.documents for select to authenticated using (is_org_member(organization_id));
create policy "documents_insert" on public.documents for insert to authenticated with check (is_org_member(organization_id));
create policy "documents_update" on public.documents for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "documents_delete" on public.documents for delete to authenticated using (is_org_member(organization_id));

create policy "tasks_select" on public.tasks for select to authenticated using (is_org_member(organization_id));
create policy "tasks_insert" on public.tasks for insert to authenticated with check (is_org_member(organization_id));
create policy "tasks_update" on public.tasks for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "tasks_delete" on public.tasks for delete to authenticated using (is_org_member(organization_id));

create policy "protocols_select" on public.protocols for select to authenticated using (is_org_member(organization_id));
create policy "protocols_insert" on public.protocols for insert to authenticated with check (is_org_member(organization_id));
create policy "protocols_update" on public.protocols for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "protocols_delete" on public.protocols for delete to authenticated using (is_org_member(organization_id));

create policy "mail_accounts_select" on public.mail_accounts for select to authenticated using (is_org_member(organization_id));
create policy "mail_accounts_insert" on public.mail_accounts for insert to authenticated with check (is_org_member(organization_id));
create policy "mail_accounts_update" on public.mail_accounts for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "mail_accounts_delete" on public.mail_accounts for delete to authenticated using (is_org_member(organization_id));

create policy "mail_threads_select" on public.mail_threads for select to authenticated using (is_org_member(organization_id));
create policy "mail_threads_insert" on public.mail_threads for insert to authenticated with check (is_org_member(organization_id));
create policy "mail_threads_update" on public.mail_threads for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "mail_threads_delete" on public.mail_threads for delete to authenticated using (is_org_member(organization_id));

create policy "mail_messages_select" on public.mail_messages for select to authenticated using (is_org_member(organization_id));
create policy "mail_messages_insert" on public.mail_messages for insert to authenticated with check (is_org_member(organization_id));
create policy "mail_messages_update" on public.mail_messages for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "mail_messages_delete" on public.mail_messages for delete to authenticated using (is_org_member(organization_id));

create policy "mail_attachments_select" on public.mail_attachments for select to authenticated using (is_org_member(organization_id));
create policy "mail_attachments_insert" on public.mail_attachments for insert to authenticated with check (is_org_member(organization_id));
create policy "mail_attachments_update" on public.mail_attachments for update to authenticated using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "mail_attachments_delete" on public.mail_attachments for delete to authenticated using (is_org_member(organization_id));
