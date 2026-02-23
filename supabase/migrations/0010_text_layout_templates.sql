-- extend templates to support offers+invoices and add missing text/layout settings fields

-- offer_templates: add doc_type (offer/invoice)
alter table public.offer_templates
  add column if not exists doc_type text not null default 'offer' check (doc_type in ('offer','invoice'));

-- Replace old unique constraint (if any) with a doc_type-aware one
-- Note: constraint name may vary; we safely drop by name if present.
alter table public.offer_templates
  drop constraint if exists offer_templates_org_id_type_key;

-- Ensure only one default per org + doc_type + type
create unique index if not exists offer_templates_default_unique
  on public.offer_templates(org_id, doc_type, type)
  where is_default = true;

-- org_text_layout_settings: add missing fields
alter table public.org_text_layout_settings
  add column if not exists retention_note_private boolean not null default true,
  add column if not exists footer_mode text not null default 'standard' check (footer_mode in ('standard','custom')),
  add column if not exists footer_custom_html text,

  add column if not exists company_name text,
  add column if not exists street text,
  add column if not exists house_number text,
  add column if not exists address_extra text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists tax_number text,
  add column if not exists vat_id text,

  add column if not exists bank_account_holder text,
  add column if not exists iban text,
  add column if not exists bic text,
  add column if not exists bank_name text,

  add column if not exists website text,
  add column if not exists email text,
  add column if not exists mobile text,
  add column if not exists phone text,

  add column if not exists legal_form text,
  add column if not exists owner_name text,
  add column if not exists register_court text,
  add column if not exists hbr_number text;
