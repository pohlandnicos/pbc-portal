-- Allow 'mixed' as offer_items.type (Mischposition)

alter table public.offer_items
  drop constraint if exists offer_items_type_check;

alter table public.offer_items
  add constraint offer_items_type_check
  check (type in ('material', 'labor', 'mixed', 'other'));
