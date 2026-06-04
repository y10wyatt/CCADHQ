select set_config('app.change_source', 'migration', true);

create type public.task_status as enum (
  'backlog',
  'planned',
  'in_progress',
  'blocked',
  'done'
);
create type public.task_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.xp_event_type as enum (
  'focus_session_completed',
  'task_completed',
  'correction'
);
create type public.finance_entry_type as enum ('income', 'expense');

create unique index work_categories_id_organization_unique
  on public.work_categories(id, organization_id);
create unique index organization_members_id_organization_unique
  on public.organization_members(id, organization_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  title text not null check (char_length(btrim(title)) > 0),
  description text,
  work_category_id uuid not null,
  status public.task_status not null default 'backlog',
  priority public.task_priority not null default 'normal',
  assignee_member_id uuid,
  due_at timestamptz,
  completed_at timestamptz,
  created_by_member_id uuid not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (work_category_id, organization_id)
    references public.work_categories(id, organization_id) on delete restrict,
  foreign key (assignee_member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict,
  foreign key (created_by_member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict,
  check (
    (status = 'done' and completed_at is not null)
    or (status <> 'done' and completed_at is null)
  )
);

create index tasks_org_status_archived_idx
  on public.tasks(organization_id, status, archived_at);
create index tasks_org_assignee_status_idx
  on public.tasks(organization_id, assignee_member_id, status);
create index tasks_org_category_status_idx
  on public.tasks(organization_id, work_category_id, status);
create index tasks_org_due_active_idx
  on public.tasks(organization_id, due_at)
  where archived_at is null;

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  event_type public.xp_event_type not null,
  points integer not null check (
    points <> 0
    and (event_type = 'correction' or points > 0)
  ),
  source_type text not null check (char_length(btrim(source_type)) > 0),
  source_id uuid,
  idempotency_key text not null check (char_length(btrim(idempotency_key)) > 0),
  actor_member_id uuid,
  description text not null check (char_length(btrim(description)) > 0),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  foreign key (actor_member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict
);

create index xp_events_org_created_idx
  on public.xp_events(organization_id, created_at desc);
create index xp_events_org_type_created_idx
  on public.xp_events(organization_id, event_type, created_at desc);
create index xp_events_org_source_idx
  on public.xp_events(organization_id, source_type, source_id);
create index xp_events_actor_member_idx
  on public.xp_events(actor_member_id);

create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (char_length(btrim(name)) > 0),
  entry_type public.finance_entry_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id, entry_type)
);

create unique index finance_categories_active_name_idx
  on public.finance_categories(organization_id, entry_type, lower(name))
  where is_active;

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  entry_type public.finance_entry_type not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  entry_date date not null,
  category_id uuid not null,
  description text not null check (char_length(btrim(description)) > 0),
  note text,
  created_by_member_id uuid not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, organization_id, entry_type)
    references public.finance_categories(id, organization_id, entry_type) on delete restrict,
  foreign key (created_by_member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict
);

create index finance_entries_org_date_active_idx
  on public.finance_entries(organization_id, entry_date desc)
  where archived_at is null;
create index finance_entries_org_type_date_active_idx
  on public.finance_entries(organization_id, entry_type, entry_date)
  where archived_at is null;
create index finance_entries_org_category_date_active_idx
  on public.finance_entries(organization_id, category_id, entry_date)
  where archived_at is null;
create index finance_entries_created_by_member_idx
  on public.finance_entries(created_by_member_id);

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();
create trigger finance_categories_set_updated_at
before update on public.finance_categories
for each row execute function private.set_updated_at();
create trigger finance_entries_set_updated_at
before update on public.finance_entries
for each row execute function private.set_updated_at();

create trigger tasks_change_history
after insert or update or delete on public.tasks
for each row execute function private.record_change_history();
create trigger xp_events_change_history
after insert or update or delete on public.xp_events
for each row execute function private.record_change_history();
create trigger finance_categories_change_history
after insert or update or delete on public.finance_categories
for each row execute function private.record_change_history();
create trigger finance_entries_change_history
after insert or update or delete on public.finance_entries
for each row execute function private.record_change_history();

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
  if not exists (
    select 1
    from public.organization_invitations
    where lower(email) = lower(new.email)
      and status = 'pending'
      and (expires_at is null or expires_at > now())
  ) then
    raise exception 'No active CCAD invitation exists for this email'
      using errcode = '42501';
  end if;

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

insert into public.organization_invitations (
  organization_id,
  email,
  role,
  status
)
select
  organization.id,
  invitation.email,
  'admin'::public.member_role,
  'pending'::public.invitation_status
from public.organizations as organization
cross join (
  values
    ('alice.wen112@gmail.com'),
    ('williamyfsun@gmail.com')
) as invitation(email)
where organization.slug = 'ccad'
  and not exists (
    select 1
    from public.organization_invitations as existing
    where existing.organization_id = organization.id
      and lower(existing.email) = lower(invitation.email)
      and existing.status = 'pending'
  );

insert into public.finance_categories (
  organization_id,
  name,
  entry_type
)
select organization.id, category.name, category.entry_type
from public.organizations as organization
cross join (
  values
    ('Tuition', 'income'::public.finance_entry_type),
    ('Miscellaneous', 'income'::public.finance_entry_type),
    ('Supplies', 'expense'::public.finance_entry_type),
    ('Rent', 'expense'::public.finance_entry_type),
    ('Payroll', 'expense'::public.finance_entry_type),
    ('Software', 'expense'::public.finance_entry_type),
    ('Marketing', 'expense'::public.finance_entry_type),
    ('Utilities', 'expense'::public.finance_entry_type),
    ('Miscellaneous', 'expense'::public.finance_entry_type)
) as category(name, entry_type)
where organization.slug = 'ccad'
  and not exists (
    select 1
    from public.finance_categories as existing
    where existing.organization_id = organization.id
      and existing.entry_type = category.entry_type
      and lower(existing.name) = lower(category.name)
      and existing.is_active
  );

alter table public.tasks enable row level security;
alter table public.xp_events enable row level security;
alter table public.finance_categories enable row level security;
alter table public.finance_entries enable row level security;

revoke all on public.tasks, public.xp_events, public.finance_categories,
  public.finance_entries from anon, authenticated;

grant select on public.tasks, public.xp_events, public.finance_categories,
  public.finance_entries to authenticated;
grant insert (
  organization_id,
  title,
  description,
  work_category_id,
  status,
  priority,
  assignee_member_id,
  due_at,
  completed_at,
  created_by_member_id
) on public.tasks to authenticated;
grant update (
  title,
  description,
  work_category_id,
  status,
  priority,
  assignee_member_id,
  due_at,
  completed_at,
  archived_at
) on public.tasks to authenticated;
grant insert (
  organization_id,
  entry_type,
  amount_minor,
  currency_code,
  entry_date,
  category_id,
  description,
  note,
  created_by_member_id
) on public.finance_entries to authenticated;
grant update (
  entry_type,
  amount_minor,
  currency_code,
  entry_date,
  category_id,
  description,
  note,
  archived_at
) on public.finance_entries to authenticated;
grant insert (organization_id, name, entry_type, is_active),
  update (name, is_active) on public.finance_categories to authenticated;

create policy tasks_select_members
on public.tasks for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy tasks_insert_members
on public.tasks for insert to authenticated
with check (
  (select private.is_org_member(organization_id))
  and created_by_member_id = (select private.current_member_id(organization_id))
);

create policy tasks_update_members
on public.tasks for update to authenticated
using ((select private.is_org_member(organization_id)))
with check ((select private.is_org_member(organization_id)));

create policy xp_events_select_members
on public.xp_events for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy finance_categories_select_members
on public.finance_categories for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy finance_categories_insert_admins
on public.finance_categories for insert to authenticated
with check ((select private.is_org_admin(organization_id)));

create policy finance_categories_update_admins
on public.finance_categories for update to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

create policy finance_entries_select_members
on public.finance_entries for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy finance_entries_insert_members
on public.finance_entries for insert to authenticated
with check (
  (select private.is_org_member(organization_id))
  and created_by_member_id = (select private.current_member_id(organization_id))
);

create policy finance_entries_update_owner_or_admin
on public.finance_entries for update to authenticated
using (
  created_by_member_id = (select private.current_member_id(organization_id))
  or (select private.is_org_admin(organization_id))
)
with check (
  created_by_member_id = (select private.current_member_id(organization_id))
  or (select private.is_org_admin(organization_id))
);
