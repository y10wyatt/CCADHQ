create type public.resource_category as enum (
  'Meetings',
  'Students',
  'Marketing',
  'Finance',
  'Teaching',
  'Admin',
  'Tech',
  'Other'
);
create type public.resource_owner as enum ('William', 'Alice', 'Team');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  title text not null check (char_length(btrim(title)) > 0),
  url text not null check (char_length(btrim(url)) > 0),
  category public.resource_category not null default 'Other',
  description text not null default '',
  owner public.resource_owner not null default 'Team',
  pinned boolean not null default false,
  archived_at timestamptz,
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resources_org_pinned_idx
on public.resources(organization_id, pinned desc, category, title)
where archived_at is null;

create trigger resources_set_updated_at
before update on public.resources
for each row execute function private.set_updated_at();

alter table public.resources enable row level security;

create policy "organization members can read resources"
on public.resources for select
to authenticated
using (private.is_org_member(organization_id));

create policy "organization members can write resources"
on public.resources for all
to authenticated
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

grant select, insert, update, delete on public.resources to authenticated;

create trigger resources_change_history
after insert or update or delete on public.resources
for each row execute function private.record_change_history();
