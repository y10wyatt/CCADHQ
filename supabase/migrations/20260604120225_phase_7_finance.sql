select set_config('app.change_source', 'migration', true);

alter table public.finance_entries
add column category_name text;

update public.finance_entries as entry
set category_name = category.name
from public.finance_categories as category
where category.id = entry.category_id
  and category.organization_id = entry.organization_id
  and category.entry_type = entry.entry_type;

alter table public.finance_entries
alter column category_name set not null;

alter table public.finance_entries
add constraint finance_entries_category_name_check check (
  char_length(btrim(category_name)) > 0
);

revoke all privileges on public.finance_entries from authenticated;
grant select on public.finance_entries to authenticated;

create or replace function public.create_finance_entry(
  target_organization_id uuid,
  finance_entry_type public.finance_entry_type,
  finance_amount_minor bigint,
  finance_entry_date date,
  finance_category_id uuid,
  finance_description text,
  finance_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid;
  category_snapshot text;
  organization_currency text;
  new_entry_id uuid;
begin
  current_member_id := private.current_member_id(target_organization_id);
  if current_member_id is null then
    raise exception 'Active organization membership required' using errcode = '42501';
  end if;
  if finance_amount_minor <= 0 then
    raise exception 'Finance amount must be positive';
  end if;

  select category.name into category_snapshot
  from public.finance_categories as category
  where category.id = finance_category_id
    and category.organization_id = target_organization_id
    and category.entry_type = finance_entry_type
    and category.is_active;
  if category_snapshot is null then
    raise exception 'Active matching finance category required';
  end if;

  select currency_code into organization_currency
  from public.organizations
  where id = target_organization_id;

  insert into public.finance_entries (
    organization_id,
    entry_type,
    amount_minor,
    currency_code,
    entry_date,
    category_id,
    category_name,
    description,
    note,
    created_by_member_id
  )
  values (
    target_organization_id,
    finance_entry_type,
    finance_amount_minor,
    organization_currency,
    finance_entry_date,
    finance_category_id,
    category_snapshot,
    btrim(finance_description),
    nullif(btrim(finance_note), ''),
    current_member_id
  )
  returning id into new_entry_id;

  return new_entry_id;
end;
$$;

create or replace function public.update_finance_entry(
  target_entry_id uuid,
  finance_entry_type public.finance_entry_type,
  finance_amount_minor bigint,
  finance_entry_date date,
  finance_category_id uuid,
  finance_description text,
  finance_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_record public.finance_entries%rowtype;
  current_member_id uuid;
  category_snapshot text;
begin
  select * into entry_record
  from public.finance_entries
  where id = target_entry_id
  for update;

  current_member_id := private.current_member_id(entry_record.organization_id);
  if entry_record.id is null or current_member_id is null then
    raise exception 'Finance entry not found' using errcode = '42501';
  end if;
  if entry_record.archived_at is not null then
    raise exception 'Archived finance entries cannot be edited';
  end if;
  if entry_record.created_by_member_id <> current_member_id
    and not private.is_org_admin(entry_record.organization_id) then
    raise exception 'Finance entry owner or admin required' using errcode = '42501';
  end if;
  if finance_amount_minor <= 0 then
    raise exception 'Finance amount must be positive';
  end if;

  select category.name into category_snapshot
  from public.finance_categories as category
  where category.id = finance_category_id
    and category.organization_id = entry_record.organization_id
    and category.entry_type = finance_entry_type
    and category.is_active;
  if category_snapshot is null then
    raise exception 'Active matching finance category required';
  end if;

  update public.finance_entries
  set entry_type = finance_entry_type,
      amount_minor = finance_amount_minor,
      entry_date = finance_entry_date,
      category_id = finance_category_id,
      category_name = category_snapshot,
      description = btrim(finance_description),
      note = nullif(btrim(finance_note), '')
  where id = target_entry_id;
end;
$$;

create or replace function public.archive_finance_entry(target_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_record public.finance_entries%rowtype;
  current_member_id uuid;
begin
  select * into entry_record
  from public.finance_entries
  where id = target_entry_id
  for update;

  current_member_id := private.current_member_id(entry_record.organization_id);
  if entry_record.id is null or current_member_id is null then
    raise exception 'Finance entry not found' using errcode = '42501';
  end if;
  if entry_record.archived_at is not null then
    return;
  end if;
  if entry_record.created_by_member_id <> current_member_id
    and not private.is_org_admin(entry_record.organization_id) then
    raise exception 'Finance entry owner or admin required' using errcode = '42501';
  end if;

  update public.finance_entries
  set archived_at = now()
  where id = target_entry_id;
end;
$$;

revoke all on function public.create_finance_entry(
  uuid, public.finance_entry_type, bigint, date, uuid, text, text
) from public, anon;
revoke all on function public.update_finance_entry(
  uuid, public.finance_entry_type, bigint, date, uuid, text, text
) from public, anon;
revoke all on function public.archive_finance_entry(uuid) from public, anon;

grant execute on function public.create_finance_entry(
  uuid, public.finance_entry_type, bigint, date, uuid, text, text
) to authenticated;
grant execute on function public.update_finance_entry(
  uuid, public.finance_entry_type, bigint, date, uuid, text, text
) to authenticated;
grant execute on function public.archive_finance_entry(uuid) to authenticated;
