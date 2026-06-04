select set_config('app.change_source', 'migration', true);

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
  category_snapshot text;
  transition_time timestamptz := now();
begin
  current_member_id := private.current_member_id(target_organization_id);
  if current_member_id is null then
    raise exception 'Active organization membership required' using errcode = '42501';
  end if;

  if session_mode = 'freeform' and session_kind <> 'focus' then
    raise exception 'Freeform sessions must be focus sessions';
  end if;

  if session_kind = 'focus' then
    select name
    into category_snapshot
    from public.work_categories
    where id = session_work_category_id
      and organization_id = target_organization_id
      and archived_at is null;

    if category_snapshot is null then
      raise exception 'Active work category required';
    end if;
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
    work_category_name,
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
    case when session_kind = 'focus' then category_snapshot end,
    case when session_kind = 'focus' then session_linked_task_id end,
    case when session_kind = 'focus' then session_continued_from_id end,
    session_mode,
    session_kind,
    'running',
    duration_seconds,
    transition_time,
    case when session_mode = 'freeform' then transition_time end,
    case when session_mode = 'pomodoro' then transition_time + make_interval(secs => duration_seconds) end
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
  transition_time timestamptz := now();
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
        paused_at = transition_time,
        ends_at = null,
        remaining_seconds_at_pause = greatest(
          0,
          ceil(extract(epoch from (session_record.ends_at - transition_time)))::integer
        )
    where id = target_session_id;
  else
    elapsed_seconds := session_record.elapsed_seconds_at_pause
      + greatest(0, floor(extract(epoch from (transition_time - session_record.resumed_at)))::integer);
    update public.focus_sessions
    set state = 'paused',
        paused_at = transition_time,
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
  transition_time timestamptz := now();
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
      resumed_at = case when mode = 'freeform' then transition_time end,
      ends_at = case
        when mode = 'pomodoro'
          then transition_time + make_interval(secs => remaining_seconds_at_pause)
      end
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
  transition_time timestamptz := now();
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
  end if;

  return jsonb_build_object(
    'session_id', session_record.id,
    'recorded_duration_seconds', recorded_seconds,
    'xp_awarded', awarded_rows = 1
  );
end;
$$;
