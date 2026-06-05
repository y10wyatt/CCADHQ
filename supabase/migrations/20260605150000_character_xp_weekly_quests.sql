select set_config('app.change_source', 'migration', true);

alter type public.xp_event_type add value if not exists 'weekly_quest_completed';

do $$
begin
  create type public.character_xp_event_type as enum (
    'focus_session_completed',
    'task_completed',
    'weekly_quest_completed',
    'streak_bonus',
    'maintenance',
    'correction'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.weekly_quest_status as enum ('active', 'completed', 'archived');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.studio_stat_key as enum (
    'stability',
    'reputation',
    'creativity',
    'community'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.character_xp_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  member_id uuid not null,
  event_type public.character_xp_event_type not null,
  points integer not null check (points <> 0),
  source_type text not null check (char_length(btrim(source_type)) > 0),
  source_id uuid,
  idempotency_key text not null check (char_length(btrim(idempotency_key)) > 0),
  actor_member_id uuid,
  description text not null check (char_length(btrim(description)) > 0),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint character_xp_events_member_org_fkey
    foreign key (member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict,
  constraint character_xp_events_actor_org_fkey
    foreign key (actor_member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict,
  constraint character_xp_events_points_guard check (
    points > 0 or event_type = 'correction'
  )
);

create unique index if not exists character_xp_events_idempotency_idx
  on public.character_xp_events(organization_id, member_id, idempotency_key);
create index if not exists character_xp_events_org_member_created_idx
  on public.character_xp_events(organization_id, member_id, created_at desc);
create index if not exists character_xp_events_org_type_created_idx
  on public.character_xp_events(organization_id, event_type, created_at desc);
create index if not exists character_xp_events_org_source_idx
  on public.character_xp_events(organization_id, source_type, source_id);

create table if not exists public.weekly_quests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  title text not null check (char_length(btrim(title)) > 0),
  description text,
  status public.weekly_quest_status not null default 'active',
  studio_stat_key public.studio_stat_key,
  xp_value integer not null default 250 check (xp_value >= 0),
  character_xp_value integer not null default 25 check (character_xp_value >= 0),
  progress_current integer not null default 0 check (progress_current >= 0),
  progress_target integer not null default 1 check (progress_target > 0),
  due_at timestamptz,
  completed_at timestamptz,
  completed_by_member_id uuid,
  archived_at timestamptz,
  created_by_member_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_quests_created_by_org_fkey
    foreign key (created_by_member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict,
  constraint weekly_quests_completed_by_org_fkey
    foreign key (completed_by_member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict,
  constraint weekly_quests_progress_target_guard
    check (progress_current <= progress_target),
  constraint weekly_quests_completed_state_guard check (
    (status = 'completed' and completed_at is not null and completed_by_member_id is not null)
    or (status <> 'completed')
  ),
  constraint weekly_quests_archived_state_guard check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived')
  )
);

create index if not exists weekly_quests_org_status_due_idx
  on public.weekly_quests(organization_id, status, due_at);
create index if not exists weekly_quests_org_created_idx
  on public.weekly_quests(organization_id, created_at desc);

create or replace function private.award_character_xp(
  target_organization_id uuid,
  target_member_id uuid,
  target_event_type public.character_xp_event_type,
  target_points integer,
  target_source_type text,
  target_source_id uuid,
  target_idempotency_key text,
  target_actor_member_id uuid,
  target_description text,
  target_metadata jsonb default '{}'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_rows integer := 0;
begin
  if target_points = 0 then
    return false;
  end if;
  if target_points < 0 and target_event_type <> 'correction' then
    raise exception 'Only corrections may subtract Character XP';
  end if;
  if not exists (
    select 1
    from public.organization_members as member
    where member.id = target_member_id
      and member.organization_id = target_organization_id
  ) then
    raise exception 'Character XP target member not found';
  end if;
  if target_actor_member_id is not null and not exists (
    select 1
    from public.organization_members as actor
    where actor.id = target_actor_member_id
      and actor.organization_id = target_organization_id
  ) then
    raise exception 'Character XP actor member not found';
  end if;

  insert into public.character_xp_events (
    organization_id,
    member_id,
    event_type,
    points,
    source_type,
    source_id,
    idempotency_key,
    actor_member_id,
    description,
    metadata
  )
  values (
    target_organization_id,
    target_member_id,
    target_event_type,
    target_points,
    btrim(target_source_type),
    target_source_id,
    btrim(target_idempotency_key),
    target_actor_member_id,
    btrim(target_description),
    coalesce(target_metadata, '{}')
  )
  on conflict (organization_id, member_id, idempotency_key) do nothing;

  get diagnostics inserted_rows = row_count;
  return inserted_rows = 1;
end;
$$;

insert into public.character_xp_events (
  organization_id,
  member_id,
  event_type,
  points,
  source_type,
  source_id,
  idempotency_key,
  actor_member_id,
  description,
  metadata,
  created_at
)
select
  event.organization_id,
  event.actor_member_id,
  event.event_type::text::public.character_xp_event_type,
  case
    when event.event_type = 'task_completed' then 15
    else event.points
  end,
  event.source_type,
  event.source_id,
  'character_' || event.idempotency_key,
  event.actor_member_id,
  replace(event.description, 'Completed task:', 'Character progress: completed task:'),
  jsonb_build_object('version', 1, 'backfilled_from_studio_xp_event_id', event.id),
  event.created_at
from public.xp_events as event
where event.actor_member_id is not null
  and event.event_type in ('focus_session_completed', 'task_completed')
on conflict (organization_id, member_id, idempotency_key) do nothing;

create or replace function public.create_weekly_quest(
  target_organization_id uuid,
  quest_title text,
  quest_description text default null,
  quest_studio_stat_key public.studio_stat_key default null,
  quest_xp_value integer default 250,
  quest_character_xp_value integer default 25,
  quest_progress_target integer default 1,
  quest_due_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid;
  new_quest_id uuid;
begin
  current_member_id := private.current_member_id(target_organization_id);
  if current_member_id is null then
    raise exception 'Active organization membership required' using errcode = '42501';
  end if;
  if quest_xp_value < 0 or quest_character_xp_value < 0 then
    raise exception 'Quest XP values cannot be negative';
  end if;
  if quest_progress_target < 1 then
    raise exception 'Quest target must be at least 1';
  end if;

  insert into public.weekly_quests (
    organization_id,
    title,
    description,
    studio_stat_key,
    xp_value,
    character_xp_value,
    progress_target,
    due_at,
    created_by_member_id
  )
  values (
    target_organization_id,
    btrim(quest_title),
    nullif(btrim(quest_description), ''),
    quest_studio_stat_key,
    quest_xp_value,
    quest_character_xp_value,
    quest_progress_target,
    quest_due_at,
    current_member_id
  )
  returning id into new_quest_id;

  return new_quest_id;
end;
$$;

create or replace function public.update_weekly_quest(
  target_quest_id uuid,
  quest_title text,
  quest_description text default null,
  quest_studio_stat_key public.studio_stat_key default null,
  quest_xp_value integer default 250,
  quest_character_xp_value integer default 25,
  quest_progress_current integer default 0,
  quest_progress_target integer default 1,
  quest_due_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  quest_record public.weekly_quests%rowtype;
begin
  select * into quest_record
  from public.weekly_quests
  where id = target_quest_id
  for update;
  if quest_record.id is null
    or private.current_member_id(quest_record.organization_id) is null then
    raise exception 'Weekly quest not found' using errcode = '42501';
  end if;
  if quest_record.status = 'archived' then
    raise exception 'Archived quests cannot be edited';
  end if;
  if quest_xp_value < 0 or quest_character_xp_value < 0 then
    raise exception 'Quest XP values cannot be negative';
  end if;
  if quest_progress_target < 1 then
    raise exception 'Quest target must be at least 1';
  end if;
  if quest_progress_current < 0 or quest_progress_current > quest_progress_target then
    raise exception 'Quest progress must be between 0 and the target';
  end if;

  update public.weekly_quests
  set title = btrim(quest_title),
      description = nullif(btrim(quest_description), ''),
      studio_stat_key = quest_studio_stat_key,
      xp_value = quest_xp_value,
      character_xp_value = quest_character_xp_value,
      progress_current = quest_progress_current,
      progress_target = quest_progress_target,
      due_at = quest_due_at
  where id = target_quest_id;
end;
$$;

create or replace function public.complete_weekly_quest(target_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  quest_record public.weekly_quests%rowtype;
  current_member_id uuid;
  completion_time timestamptz := now();
  previous_total bigint;
  new_total bigint;
  studio_awarded_rows integer := 0;
  character_awarded boolean := false;
begin
  select * into quest_record
  from public.weekly_quests
  where id = target_quest_id
  for update;
  current_member_id := private.current_member_id(quest_record.organization_id);
  if quest_record.id is null or current_member_id is null then
    raise exception 'Weekly quest not found' using errcode = '42501';
  end if;
  if quest_record.status = 'archived' then
    raise exception 'Archived quests cannot be completed';
  end if;

  perform organization.id
  from public.organizations as organization
  where organization.id = quest_record.organization_id
  for update;

  select coalesce(sum(points), 0)
  into previous_total
  from public.xp_events
  where organization_id = quest_record.organization_id;

  if quest_record.status <> 'completed' then
    update public.weekly_quests
    set status = 'completed',
        progress_current = progress_target,
        completed_at = completion_time,
        completed_by_member_id = current_member_id
    where id = target_quest_id;
  end if;

  if quest_record.xp_value > 0 then
    insert into public.xp_events (
      organization_id,
      event_type,
      points,
      source_type,
      source_id,
      idempotency_key,
      actor_member_id,
      description,
      metadata
    )
    values (
      quest_record.organization_id,
      'weekly_quest_completed',
      quest_record.xp_value,
      'weekly_quest',
      quest_record.id,
      'weekly_quest_completed:' || quest_record.id::text,
      current_member_id,
      'Completed weekly quest: ' || quest_record.title,
      jsonb_build_object('version', 1, 'studio_stat_key', quest_record.studio_stat_key)
    )
    on conflict (organization_id, idempotency_key) do nothing;
    get diagnostics studio_awarded_rows = row_count;
  end if;

  character_awarded := private.award_character_xp(
    quest_record.organization_id,
    current_member_id,
    'weekly_quest_completed',
    quest_record.character_xp_value,
    'weekly_quest',
    quest_record.id,
    'weekly_quest_completed:' || quest_record.id::text,
    current_member_id,
    'Completed weekly quest: ' || quest_record.title,
    jsonb_build_object('version', 1, 'studio_stat_key', quest_record.studio_stat_key)
  );

  select coalesce(sum(points), 0)
  into new_total
  from public.xp_events
  where organization_id = quest_record.organization_id;

  return jsonb_build_object(
    'quest_id', quest_record.id,
    'studio_xp_awarded', studio_awarded_rows = 1,
    'character_xp_awarded', character_awarded,
    'previous_level', private.studio_level(previous_total),
    'new_level', private.studio_level(new_total)
  );
end;
$$;

create or replace function public.archive_weekly_quest(target_quest_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  quest_record public.weekly_quests%rowtype;
begin
  select * into quest_record
  from public.weekly_quests
  where id = target_quest_id
  for update;
  if quest_record.id is null
    or private.current_member_id(quest_record.organization_id) is null then
    raise exception 'Weekly quest not found' using errcode = '42501';
  end if;
  if quest_record.status = 'archived' then
    return;
  end if;
  update public.weekly_quests
  set status = 'archived',
      archived_at = now()
  where id = target_quest_id;
end;
$$;

create or replace function public.complete_focus_session(target_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_record public.focus_sessions%rowtype;
  transition_time timestamptz := now();
  recorded_seconds integer;
  awarded_rows integer := 0;
  character_awarded boolean := false;
  previous_total bigint;
  new_total bigint;
begin
  select *
  into session_record
  from public.focus_sessions
  where id = target_session_id
  for update;

  if session_record.id is null
    or session_record.member_id <> private.current_member_id(session_record.organization_id) then
    raise exception 'Focus session not found' using errcode = '42501';
  end if;

  perform organization.id
  from public.organizations as organization
  where organization.id = session_record.organization_id
  for update;

  select coalesce(sum(points), 0)
  into previous_total
  from public.xp_events
  where organization_id = session_record.organization_id;

  if session_record.state = 'completed' then
    return jsonb_build_object(
      'session_id', session_record.id,
      'recorded_duration_seconds', session_record.recorded_duration_seconds,
      'xp_awarded', exists (
        select 1 from public.xp_events
        where organization_id = session_record.organization_id
          and idempotency_key = 'focus_session_completed:' || session_record.id::text
      ),
      'character_xp_awarded', exists (
        select 1 from public.character_xp_events
        where organization_id = session_record.organization_id
          and member_id = session_record.member_id
          and idempotency_key = 'focus_session_completed:' || session_record.id::text
      ),
      'previous_level', private.studio_level(previous_total),
      'new_level', private.studio_level(previous_total)
    );
  end if;
  if session_record.state not in ('running', 'paused') then
    raise exception 'Only an active session can be completed';
  end if;

  recorded_seconds := case
    when session_record.mode = 'freeform' and session_record.state = 'running'
      then session_record.elapsed_seconds_at_pause
        + greatest(0, floor(extract(epoch from (transition_time - session_record.resumed_at)))::integer)
    when session_record.mode = 'freeform'
      then session_record.elapsed_seconds_at_pause
    when session_record.state = 'running'
      then session_record.planned_duration_seconds - greatest(
        0,
        ceil(extract(epoch from (session_record.ends_at - transition_time)))::integer
      )
    else session_record.planned_duration_seconds - session_record.remaining_seconds_at_pause
  end;
  recorded_seconds := greatest(0, least(
    recorded_seconds,
    coalesce(session_record.planned_duration_seconds, recorded_seconds)
  ));

  update public.focus_sessions
  set state = 'completed',
      recorded_duration_seconds = recorded_seconds,
      completed_at = transition_time,
      ends_at = null,
      resumed_at = null,
      paused_at = null
  where id = target_session_id;

  if session_record.mode = 'pomodoro'
    and session_record.kind = 'focus'
    and recorded_seconds >= session_record.planned_duration_seconds then
    insert into public.xp_events (
      organization_id,
      event_type,
      points,
      source_type,
      source_id,
      idempotency_key,
      actor_member_id,
      description,
      metadata
    )
    values (
      session_record.organization_id,
      'focus_session_completed',
      10,
      'focus_session',
      session_record.id,
      'focus_session_completed:' || session_record.id::text,
      session_record.member_id,
      'Completed Pomodoro focus: ' || session_record.work_name,
      jsonb_build_object('duration_seconds', recorded_seconds)
    )
    on conflict (organization_id, idempotency_key) do nothing;
    get diagnostics awarded_rows = row_count;

    character_awarded := private.award_character_xp(
      session_record.organization_id,
      session_record.member_id,
      'focus_session_completed',
      10,
      'focus_session',
      session_record.id,
      'focus_session_completed:' || session_record.id::text,
      session_record.member_id,
      'Completed focus session: ' || session_record.work_name,
      jsonb_build_object('duration_seconds', recorded_seconds)
    );
  end if;

  select coalesce(sum(points), 0)
  into new_total
  from public.xp_events
  where organization_id = session_record.organization_id;

  return jsonb_build_object(
    'session_id', session_record.id,
    'recorded_duration_seconds', recorded_seconds,
    'xp_awarded', awarded_rows = 1,
    'character_xp_awarded', character_awarded,
    'previous_level', private.studio_level(previous_total),
    'new_level', private.studio_level(new_total)
  );
end;
$$;

create or replace function public.transition_task(
  target_task_id uuid,
  target_status public.task_status
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_record public.tasks%rowtype;
  current_member_id uuid;
  transition_time timestamptz := now();
  previous_total bigint;
  new_total bigint;
  awarded_rows integer := 0;
  character_awarded boolean := false;
begin
  select * into task_record
  from public.tasks
  where id = target_task_id
  for update;
  current_member_id := private.current_member_id(task_record.organization_id);
  if task_record.id is null or current_member_id is null then
    raise exception 'Task not found' using errcode = '42501';
  end if;
  if task_record.archived_at is not null then
    raise exception 'Archived tasks cannot be moved';
  end if;

  if task_record.status = target_status then
    select coalesce(sum(points), 0)
    into new_total
    from public.xp_events
    where organization_id = task_record.organization_id;

    return jsonb_build_object(
      'task_id', task_record.id,
      'status', target_status,
      'xp_awarded', false,
      'character_xp_awarded', false,
      'previous_level', private.studio_level(new_total),
      'new_level', private.studio_level(new_total)
    );
  end if;

  perform organization.id
  from public.organizations as organization
  where organization.id = task_record.organization_id
  for update;

  select coalesce(sum(points), 0)
  into previous_total
  from public.xp_events
  where organization_id = task_record.organization_id;

  update public.tasks
  set status = target_status,
      completed_at = case when target_status = 'done' then transition_time end,
      first_completed_at = case
        when target_status = 'done' then coalesce(first_completed_at, transition_time)
        else first_completed_at
      end
  where id = target_task_id;

  if target_status = 'done' then
    insert into public.xp_events (
      organization_id,
      event_type,
      points,
      source_type,
      source_id,
      idempotency_key,
      actor_member_id,
      description,
      metadata
    )
    values (
      task_record.organization_id,
      'task_completed',
      20,
      'task',
      task_record.id,
      'task_completed:' || task_record.id::text,
      current_member_id,
      'Completed task: ' || task_record.title,
      jsonb_build_object('version', 1)
    )
    on conflict (organization_id, idempotency_key) do nothing;
    get diagnostics awarded_rows = row_count;

    character_awarded := private.award_character_xp(
      task_record.organization_id,
      current_member_id,
      'task_completed',
      15,
      'task',
      task_record.id,
      'task_completed:' || task_record.id::text,
      current_member_id,
      'Completed task: ' || task_record.title,
      jsonb_build_object('version', 1)
    );
  end if;

  select coalesce(sum(points), 0)
  into new_total
  from public.xp_events
  where organization_id = task_record.organization_id;

  return jsonb_build_object(
    'task_id', task_record.id,
    'status', target_status,
    'xp_awarded', awarded_rows = 1,
    'character_xp_awarded', character_awarded,
    'previous_level', private.studio_level(previous_total),
    'new_level', private.studio_level(new_total)
  );
end;
$$;

insert into public.weekly_quests (
  organization_id,
  title,
  description,
  studio_stat_key,
  xp_value,
  character_xp_value,
  progress_current,
  progress_target,
  due_at,
  created_by_member_id
)
select
  organization.id,
  seed.title,
  seed.description,
  seed.studio_stat_key::public.studio_stat_key,
  seed.xp_value,
  seed.character_xp_value,
  seed.progress_current,
  seed.progress_target,
  seed.due_at,
  creator.id
from public.organizations as organization
join lateral (
  select member.id
  from public.organization_members as member
  where member.organization_id = organization.id
    and member.is_active
  order by case when member.role = 'admin' then 0 else 1 end, member.joined_at
  limit 1
) as creator on true
cross join (
  values
    (
      'Close the weekly studio admin loop',
      'Review priority tasks, finance updates, and any blocked handoffs before the week ends.',
      'stability',
      250,
      25,
      0,
      5,
      date_trunc('week', now()) + interval '4 days 17 hours'
    ),
    (
      'Prepare one public student-work highlight',
      'Choose one strong student-work moment and prepare it for a public-facing update.',
      'reputation',
      250,
      25,
      0,
      3,
      date_trunc('week', now()) + interval '4 days 17 hours'
    )
) as seed(title, description, studio_stat_key, xp_value, character_xp_value, progress_current, progress_target, due_at)
where organization.slug = 'ccad'
  and not exists (
    select 1
    from public.weekly_quests as existing
    where existing.organization_id = organization.id
  );

alter table public.character_xp_events enable row level security;
alter table public.weekly_quests enable row level security;

revoke all on public.character_xp_events, public.weekly_quests from anon, authenticated;
grant select on public.character_xp_events, public.weekly_quests to authenticated;

create policy character_xp_events_select_members
on public.character_xp_events for select to authenticated
using (private.is_org_member(organization_id));

create policy weekly_quests_select_members
on public.weekly_quests for select to authenticated
using (private.is_org_member(organization_id));

create trigger character_xp_events_change_history
after insert or update or delete on public.character_xp_events
for each row execute function private.record_change_history();

create trigger weekly_quests_set_updated_at
before update on public.weekly_quests
for each row execute function private.set_updated_at();

create trigger weekly_quests_change_history
after insert or update or delete on public.weekly_quests
for each row execute function private.record_change_history();

revoke all on function private.award_character_xp(
  uuid,
  uuid,
  public.character_xp_event_type,
  integer,
  text,
  uuid,
  text,
  uuid,
  text,
  jsonb
) from public, anon, authenticated;

revoke all on function public.create_weekly_quest(
  uuid, text, text, public.studio_stat_key, integer, integer, integer, timestamptz
) from public, anon;
revoke all on function public.update_weekly_quest(
  uuid, text, text, public.studio_stat_key, integer, integer, integer, integer, timestamptz
) from public, anon;
revoke all on function public.complete_weekly_quest(uuid) from public, anon;
revoke all on function public.archive_weekly_quest(uuid) from public, anon;

grant execute on function public.create_weekly_quest(
  uuid, text, text, public.studio_stat_key, integer, integer, integer, timestamptz
) to authenticated;
grant execute on function public.update_weekly_quest(
  uuid, text, text, public.studio_stat_key, integer, integer, integer, integer, timestamptz
) to authenticated;
grant execute on function public.complete_weekly_quest(uuid) to authenticated;
grant execute on function public.archive_weekly_quest(uuid) to authenticated;
