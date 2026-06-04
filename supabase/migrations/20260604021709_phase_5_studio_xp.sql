select set_config('app.change_source', 'migration', true);

create or replace function private.studio_level(total_xp bigint)
returns integer
language sql
immutable
set search_path = ''
as $$
  select floor(sqrt(greatest(total_xp, 0)::numeric / 100))::integer + 1
$$;

create or replace function public.create_studio_xp_correction(
  target_organization_id uuid,
  correction_points integer,
  correction_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid;
  correction_id uuid := gen_random_uuid();
  previous_total bigint;
  new_total bigint;
begin
  current_member_id := private.current_member_id(target_organization_id);
  if current_member_id is null
    or not private.is_org_admin(target_organization_id) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if correction_points = 0 then
    raise exception 'Correction points must be non-zero';
  end if;
  if char_length(btrim(correction_reason)) < 3
    or char_length(correction_reason) > 500 then
    raise exception 'Correction reason must be between 3 and 500 characters';
  end if;

  select coalesce(sum(points), 0)
  into previous_total
  from public.xp_events
  where organization_id = target_organization_id;

  new_total := previous_total + correction_points;
  if new_total < 0 then
    raise exception 'Correction cannot reduce Studio XP below zero';
  end if;

  insert into public.xp_events (
    id,
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
    correction_id,
    target_organization_id,
    'correction',
    correction_points,
    'manual_correction',
    correction_id,
    'correction:' || correction_id::text,
    current_member_id,
    'Studio XP correction: ' || btrim(correction_reason),
    jsonb_build_object('reason', btrim(correction_reason), 'version', 1)
  );

  return jsonb_build_object(
    'event_id', correction_id,
    'previous_total', previous_total,
    'new_total', new_total,
    'previous_level', private.studio_level(previous_total),
    'new_level', private.studio_level(new_total)
  );
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
  end if;

  select coalesce(sum(points), 0)
  into new_total
  from public.xp_events
  where organization_id = session_record.organization_id;

  return jsonb_build_object(
    'session_id', session_record.id,
    'recorded_duration_seconds', recorded_seconds,
    'xp_awarded', awarded_rows = 1,
    'previous_level', private.studio_level(previous_total),
    'new_level', private.studio_level(new_total)
  );
end;
$$;

revoke all on function private.studio_level(bigint) from public;
grant execute on function private.studio_level(bigint) to authenticated;
revoke all on function public.create_studio_xp_correction(uuid, integer, text)
  from public, anon;
grant execute on function public.create_studio_xp_correction(uuid, integer, text)
  to authenticated;
