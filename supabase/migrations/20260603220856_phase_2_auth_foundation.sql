create schema if not exists private;

create type public.member_role as enum ('staff', 'admin');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.change_operation as enum ('insert', 'update', 'delete');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  slug text not null unique check (slug = lower(slug)),
  timezone text not null default 'America/Vancouver',
  currency_code text not null default 'CAD' check (currency_code ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (char_length(btrim(display_name)) > 0),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  role public.member_role not null default 'staff',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_active_idx
  on public.organization_members(user_id, is_active);
create index organization_members_org_active_idx
  on public.organization_members(organization_id, is_active);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  email text not null check (email = lower(email) and char_length(btrim(email)) > 3),
  role public.member_role not null default 'staff',
  status public.invitation_status not null default 'pending',
  invited_by_member_id uuid references public.organization_members(id) on delete restrict,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index organization_invitations_pending_email_idx
  on public.organization_invitations(organization_id, lower(email))
  where status = 'pending';
create index organization_invitations_email_status_idx
  on public.organization_invitations(lower(email), status);

create table public.work_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (char_length(btrim(name)) > 0),
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index work_categories_active_name_idx
  on public.work_categories(organization_id, lower(name))
  where archived_at is null;
create index work_categories_org_archived_idx
  on public.work_categories(organization_id, archived_at);

create table public.change_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete restrict,
  table_name text not null,
  record_id uuid,
  operation public.change_operation not null,
  actor_user_id uuid references auth.users(id) on delete restrict,
  actor_member_id uuid references public.organization_members(id) on delete restrict,
  source text not null default 'app',
  changed_fields text[] not null default '{}',
  old_data jsonb,
  new_data jsonb,
  occurred_at timestamptz not null default now()
);

create index change_history_org_occurred_idx
  on public.change_history(organization_id, occurred_at desc);
create index change_history_record_idx
  on public.change_history(table_name, record_id, occurred_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_member_id uuid references public.organization_members(id) on delete restrict,
  action text not null check (char_length(btrim(action)) > 0),
  entity_type text not null check (char_length(btrim(entity_type)) > 0),
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_events_org_created_idx
  on public.audit_events(organization_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.current_member_id(target_organization_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select membership.id
  from public.organization_members as membership
  where membership.organization_id = target_organization_id
    and membership.user_id = (select auth.uid())
    and membership.is_active
  limit 1
$$;

create or replace function private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.is_active
  )
$$;

create or replace function private.is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'admin'
      and membership.is_active
  )
$$;

create or replace function private.shares_org_with_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as mine
    join public.organization_members as theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and mine.is_active
      and theirs.user_id = target_user_id
      and theirs.is_active
  )
$$;

create or replace function private.record_change_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  target_organization_id uuid;
  target_record_id uuid;
  current_actor_user_id uuid;
  current_actor_member_id uuid;
  fields text[] := '{}';
  change_source text;
begin
  old_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  target_record_id := coalesce((new_row ->> 'id')::uuid, (old_row ->> 'id')::uuid);

  if tg_table_name = 'organizations' then
    target_organization_id := target_record_id;
  elsif tg_table_name = 'profiles' then
    select membership.organization_id
    into target_organization_id
    from public.organization_members as membership
    where membership.user_id = target_record_id
      and membership.is_active
    order by membership.joined_at
    limit 1;
  else
    target_organization_id := coalesce(
      (new_row ->> 'organization_id')::uuid,
      (old_row ->> 'organization_id')::uuid
    );
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(keys.key order by keys.key), '{}')
    into fields
    from (
      select key
      from jsonb_object_keys(new_row) as key
      where new_row -> key is distinct from old_row -> key
    ) as keys;
  elsif tg_op = 'INSERT' then
    select coalesce(array_agg(key order by key), '{}')
    into fields
    from jsonb_object_keys(new_row) as key;
  else
    select coalesce(array_agg(key order by key), '{}')
    into fields
    from jsonb_object_keys(old_row) as key;
  end if;

  current_actor_user_id := auth.uid();
  if current_actor_user_id is not null and target_organization_id is not null then
    select membership.id
    into current_actor_member_id
    from public.organization_members as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = current_actor_user_id
    limit 1;
  end if;

  change_source := nullif(current_setting('app.change_source', true), '');
  insert into public.change_history (
    organization_id,
    table_name,
    record_id,
    operation,
    actor_user_id,
    actor_member_id,
    source,
    changed_fields,
    old_data,
    new_data
  )
  values (
    target_organization_id,
    tg_table_name,
    target_record_id,
    lower(tg_op)::public.change_operation,
    current_actor_user_id,
    current_actor_member_id,
    coalesce(change_source, 'app'),
    fields,
    old_row,
    new_row
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation record;
  resolved_display_name text;
begin
  resolved_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1),
    'CCAD staff'
  );

  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, resolved_display_name, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do update
  set display_name = excluded.display_name,
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  for invitation in
    select *
    from public.organization_invitations
    where lower(email) = lower(new.email)
      and status = 'pending'
      and (expires_at is null or expires_at > now())
  loop
    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      is_active
    )
    values (
      invitation.organization_id,
      new.id,
      invitation.role,
      true
    )
    on conflict (organization_id, user_id) do update
    set role = excluded.role,
        is_active = true,
        updated_at = now();

    update public.organization_invitations
    set status = 'accepted',
        accepted_at = now(),
        updated_at = now()
    where id = invitation.id;
  end loop;

  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();
create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function private.set_updated_at();
create trigger organization_invitations_set_updated_at
before update on public.organization_invitations
for each row execute function private.set_updated_at();
create trigger work_categories_set_updated_at
before update on public.work_categories
for each row execute function private.set_updated_at();

create trigger organizations_change_history
after insert or update or delete on public.organizations
for each row execute function private.record_change_history();
create trigger profiles_change_history
after insert or update or delete on public.profiles
for each row execute function private.record_change_history();
create trigger organization_members_change_history
after insert or update or delete on public.organization_members
for each row execute function private.record_change_history();
create trigger organization_invitations_change_history
after insert or update or delete on public.organization_invitations
for each row execute function private.record_change_history();
create trigger work_categories_change_history
after insert or update or delete on public.work_categories
for each row execute function private.record_change_history();
create trigger audit_events_change_history
after insert or update or delete on public.audit_events
for each row execute function private.record_change_history();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

insert into public.organizations (name, slug, timezone, currency_code)
values ('Cloud Centre of Art & Design', 'ccad', 'America/Vancouver', 'CAD')
on conflict (slug) do nothing;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.work_categories enable row level security;
alter table public.change_history enable row level security;
alter table public.audit_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant usage on schema private to authenticated;

grant select on public.organizations, public.profiles, public.organization_members,
  public.organization_invitations, public.work_categories, public.change_history,
  public.audit_events to authenticated;
grant update (name, timezone, currency_code) on public.organizations to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant insert (organization_id, user_id, role, is_active),
  update (role, is_active) on public.organization_members to authenticated;
grant insert (organization_id, email, role, status, invited_by_member_id, expires_at),
  update (role, status, expires_at) on public.organization_invitations to authenticated;
grant insert (organization_id, name, created_by_member_id),
  update (name, archived_at) on public.work_categories to authenticated;

revoke all on all functions in schema private from public;
grant execute on function private.current_member_id(uuid) to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_admin(uuid) to authenticated;
grant execute on function private.shares_org_with_user(uuid) to authenticated;

create policy organizations_select_members
on public.organizations for select to authenticated
using ((select private.is_org_member(id)));

create policy organizations_update_admins
on public.organizations for update to authenticated
using ((select private.is_org_admin(id)))
with check ((select private.is_org_admin(id)));

create policy profiles_select_shared_org
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select private.shares_org_with_user(id))
);

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy organization_members_select_members
on public.organization_members for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy organization_members_insert_admins
on public.organization_members for insert to authenticated
with check ((select private.is_org_admin(organization_id)));

create policy organization_members_update_admins
on public.organization_members for update to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

create policy organization_invitations_select_admins
on public.organization_invitations for select to authenticated
using ((select private.is_org_admin(organization_id)));

create policy organization_invitations_insert_admins
on public.organization_invitations for insert to authenticated
with check (
  (select private.is_org_admin(organization_id))
  and invited_by_member_id = (select private.current_member_id(organization_id))
);

create policy organization_invitations_update_admins
on public.organization_invitations for update to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

create policy work_categories_select_members
on public.work_categories for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy work_categories_insert_members
on public.work_categories for insert to authenticated
with check (
  (select private.is_org_member(organization_id))
  and created_by_member_id = (select private.current_member_id(organization_id))
);

create policy work_categories_update_members
on public.work_categories for update to authenticated
using ((select private.is_org_member(organization_id)))
with check ((select private.is_org_member(organization_id)));

create policy change_history_select_admins
on public.change_history for select to authenticated
using (
  organization_id is not null
  and (select private.is_org_admin(organization_id))
);

create policy audit_events_select_admins
on public.audit_events for select to authenticated
using ((select private.is_org_admin(organization_id)));
