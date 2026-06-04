select set_config('app.change_source', 'migration', true);

create type public.focus_mode as enum ('pomodoro', 'freeform');
create type public.focus_kind as enum ('focus', 'short_break', 'long_break');
create type public.focus_state as enum ('running', 'paused', 'completed', 'cancelled');

create unique index tasks_id_organization_unique
  on public.tasks(id, organization_id);

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  member_id uuid not null,
  work_name text,
  work_description text,
  work_category_id uuid,
  linked_task_id uuid,
  continued_from_session_id uuid,
  mode public.focus_mode not null,
  kind public.focus_kind not null,
  state public.focus_state not null default 'running',
  planned_duration_seconds integer,
  started_at timestamptz not null default now(),
  resumed_at timestamptz,
  ends_at timestamptz,
  paused_at timestamptz,
  remaining_seconds_at_pause integer,
  elapsed_seconds_at_pause integer not null default 0,
  recorded_duration_seconds integer,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict,
  foreign key (work_category_id, organization_id)
    references public.work_categories(id, organization_id) on delete restrict,
  foreign key (linked_task_id, organization_id)
    references public.tasks(id, organization_id) on delete restrict,
  foreign key (continued_from_session_id, organization_id)
    references public.focus_sessions(id, organization_id) on delete restrict,
  check (
    (
      kind = 'focus'
      and work_name is not null
      and work_description is not null
      and char_length(btrim(work_name)) > 0
      and char_length(btrim(work_description)) > 0
      and work_category_id is not null
    )
    or (
      kind <> 'focus'
      and work_name is null
      and work_description is null
      and work_category_id is null
      and linked_task_id is null
      and continued_from_session_id is null
    )
  ),
  check (
    (mode = 'freeform' and kind = 'focus' and planned_duration_seconds is null)
    or (
      mode = 'pomodoro'
      and planned_duration_seconds = case kind
        when 'focus' then 1500
        when 'short_break' then 300
        when 'long_break' then 900
      end
    )
  ),
  check (
    planned_duration_seconds is null or planned_duration_seconds >= 0
  ),
  check (
    remaining_seconds_at_pause is null or remaining_seconds_at_pause >= 0
  ),
  check (elapsed_seconds_at_pause >= 0),
  check (
    recorded_duration_seconds is null or recorded_duration_seconds >= 0
  ),
  check (
    (state = 'completed' and completed_at is not null and recorded_duration_seconds is not null)
    or (state <> 'completed' and completed_at is null)
  ),
  check (
    (state = 'cancelled' and cancelled_at is not null)
    or (state <> 'cancelled' and cancelled_at is null)
  ),
  check (
    (state = 'paused' and paused_at is not null)
    or (state <> 'paused' and paused_at is null)
  )
);

create unique index focus_sessions_one_active_member_idx
  on public.focus_sessions(member_id)
  where state in ('running', 'paused');
create index focus_sessions_org_member_created_idx
  on public.focus_sessions(organization_id, member_id, created_at desc);
create index focus_sessions_org_state_idx
  on public.focus_sessions(organization_id, state);
create index focus_sessions_org_category_created_idx
  on public.focus_sessions(organization_id, work_category_id, created_at desc);
create index focus_sessions_org_task_created_idx
  on public.focus_sessions(organization_id, linked_task_id, created_at desc);
create index focus_sessions_member_org_idx
  on public.focus_sessions(member_id, organization_id);
create index focus_sessions_category_org_idx
  on public.focus_sessions(work_category_id, organization_id);
create index focus_sessions_task_org_idx
  on public.focus_sessions(linked_task_id, organization_id);
create index focus_sessions_continued_org_idx
  on public.focus_sessions(continued_from_session_id, organization_id);

create trigger focus_sessions_set_updated_at
before update on public.focus_sessions
for each row execute function private.set_updated_at();

create trigger focus_sessions_change_history
after insert or update or delete on public.focus_sessions
for each row execute function private.record_change_history();

insert into public.work_categories (
  organization_id,
  name,
  created_by_member_id
)
select organization.id, category.name, first_member.id
from public.organizations as organization
join lateral (
  select member.id
  from public.organization_members as member
  where member.organization_id = organization.id
    and member.is_active
  order by member.joined_at
  limit 1
) as first_member on true
cross join (
  values
    ('Administration'),
    ('Teaching & Curriculum'),
    ('Marketing'),
    ('Finance'),
    ('Studio & Facilities'),
    ('Other')
) as category(name)
where organization.slug = 'ccad'
on conflict do nothing;

create or replace function public.start_focus_session(
  target_organization_id uuid,
  session_mode public.focus_mode,
  session_kind public.focus_kind,
  session_work_name text default null,
  session_work_description text default null,
  session_work_category_id uuid default null,
  session_linked_task_id uuid default null,
  session_continued_from_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid;
  new_session_id uuid;
  duration_seconds integer;
  current_time timestamptz := now();
begin
  current_member_id := private.current_member_id(target_organization_id);
  if current_member_id is null then
    raise exception 'Active organization membership required' using errcode = '42501';
  end if;

  if session_mode = 'freeform' and session_kind <> 'focus' then
    raise exception 'Freeform sessions must be focus sessions';
  end if;

  duration_seconds := case
    when session_mode = 'freeform' then null
    when session_kind = 'focus' then 1500
    when session_kind = 'short_break' then 300
    when session_kind = 'long_break' then 900
  end;

  insert into public.focus_sessions (
    organization_id,
    member_id,
    work_name,
    work_description,
    work_category_id,
    linked_task_id,
    continued_from_session_id,
    mode,
    kind,
    state,
    planned_duration_seconds,
    started_at,
    resumed_at,
    ends_at
  )
  values (
    target_organization_id,
    current_member_id,
    case when session_kind = 'focus' then btrim(session_work_name) end,
    case when session_kind = 'focus' then btrim(session_work_description) end,
    case when session_kind = 'focus' then session_work_category_id end,
    case when session_kind = 'focus' then session_linked_task_id end,
    case when session_kind = 'focus' then session_continued_from_id end,
    session_mode,
    session_kind,
    'running',
    duration_seconds,
    current_time,
    case when session_mode = 'freeform' then current_time end,
    case when session_mode = 'pomodoro' then current_time + make_interval(secs => duration_seconds) end
  )
  returning id into new_session_id;

  return new_session_id;
end;
$$;

create or replace function public.pause_focus_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_record public.focus_sessions%rowtype;
  current_time timestamptz := now();
  elapsed_seconds integer;
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
  if session_record.state <> 'running' then
    raise exception 'Only a running session can be paused';
  end if;

  if session_record.mode = 'pomodoro' then
    update public.focus_sessions
    set state = 'paused',
        paused_at = current_time,
        ends_at = null,
        remaining_seconds_at_pause = greatest(
          0,
          ceil(extract(epoch from (session_record.ends_at - current_time)))::integer
        )
    where id = target_session_id;
  else
    elapsed_seconds := session_record.elapsed_seconds_at_pause
      + greatest(0, floor(extract(epoch from (current_time - session_record.resumed_at)))::integer);
    update public.focus_sessions
    set state = 'paused',
        paused_at = current_time,
        resumed_at = null,
        elapsed_seconds_at_pause = elapsed_seconds
    where id = target_session_id;
  end if;
end;
$$;

create or replace function public.resume_focus_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_record public.focus_sessions%rowtype;
  current_time timestamptz := now();
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
  if session_record.state <> 'paused' then
    raise exception 'Only a paused session can be resumed';
  end if;

  update public.focus_sessions
  set state = 'running',
      paused_at = null,
      resumed_at = case when mode = 'freeform' then current_time end,
      ends_at = case
        when mode = 'pomodoro'
          then current_time + make_interval(secs => remaining_seconds_at_pause)
      end
  where id = target_session_id;
end;
$$;

create or replace function public.update_focus_session_details(
  target_session_id uuid,
  session_work_name text,
  session_work_description text,
  session_work_category_id uuid,
  session_linked_task_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_record public.focus_sessions%rowtype;
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
  if session_record.state not in ('running', 'paused') or session_record.kind <> 'focus' then
    raise exception 'Only active focus-session details can be edited';
  end if;

  update public.focus_sessions
  set work_name = btrim(session_work_name),
      work_description = btrim(session_work_description),
      work_category_id = session_work_category_id,
      linked_task_id = session_linked_task_id
  where id = target_session_id;
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
  current_time timestamptz := now();
  recorded_seconds integer;
  awarded_rows integer := 0;
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

  if session_record.state = 'completed' then
    return jsonb_build_object(
      'session_id', session_record.id,
      'recorded_duration_seconds', session_record.recorded_duration_seconds,
      'xp_awarded', exists (
        select 1 from public.xp_events
        where organization_id = session_record.organization_id
          and idempotency_key = 'focus_session_completed:' || session_record.id::text
      )
    );
  end if;
  if session_record.state not in ('running', 'paused') then
    raise exception 'Only an active session can be completed';
  end if;

  recorded_seconds := case
    when session_record.mode = 'freeform' and session_record.state = 'running'
      then session_record.elapsed_seconds_at_pause
        + greatest(0, floor(extract(epoch from (current_time - session_record.resumed_at)))::integer)
    when session_record.mode = 'freeform'
      then session_record.elapsed_seconds_at_pause
    when session_record.state = 'running'
      then session_record.planned_duration_seconds - greatest(
        0,
        ceil(extract(epoch from (session_record.ends_at - current_time)))::integer
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
      completed_at = current_time,
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
  end if;

  return jsonb_build_object(
    'session_id', session_record.id,
    'recorded_duration_seconds', recorded_seconds,
    'xp_awarded', awarded_rows = 1
  );
end;
$$;

create or replace function public.cancel_focus_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_record public.focus_sessions%rowtype;
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
  if session_record.state not in ('running', 'paused') then
    raise exception 'Only an active session can be cancelled';
  end if;

  update public.focus_sessions
  set state = 'cancelled',
      cancelled_at = now(),
      ends_at = null,
      resumed_at = null,
      paused_at = null
  where id = target_session_id;
end;
$$;

alter table public.focus_sessions enable row level security;
revoke all on public.focus_sessions from anon, authenticated;
grant select on public.focus_sessions to authenticated;

create policy focus_sessions_select_members
on public.focus_sessions for select to authenticated
using ((select private.is_org_member(organization_id)));

revoke all on function public.start_focus_session(
  uuid, public.focus_mode, public.focus_kind, text, text, uuid, uuid, uuid
) from public, anon;
revoke all on function public.pause_focus_session(uuid) from public, anon;
revoke all on function public.resume_focus_session(uuid) from public, anon;
revoke all on function public.update_focus_session_details(uuid, text, text, uuid, uuid)
  from public, anon;
revoke all on function public.complete_focus_session(uuid) from public, anon;
revoke all on function public.cancel_focus_session(uuid) from public, anon;

grant execute on function public.start_focus_session(
  uuid, public.focus_mode, public.focus_kind, text, text, uuid, uuid, uuid
) to authenticated;
grant execute on function public.pause_focus_session(uuid) to authenticated;
grant execute on function public.resume_focus_session(uuid) to authenticated;
grant execute on function public.update_focus_session_details(uuid, text, text, uuid, uuid)
  to authenticated;
grant execute on function public.complete_focus_session(uuid) to authenticated;
grant execute on function public.cancel_focus_session(uuid) to authenticated;
