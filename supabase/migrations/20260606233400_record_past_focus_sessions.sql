select set_config('app.change_source', 'migration', true);

create or replace function public.record_past_focus_session(
  target_organization_id uuid,
  session_mode public.focus_mode,
  session_work_name text,
  session_work_description text,
  session_work_category_id uuid,
  session_linked_task_id uuid,
  session_started_at timestamptz,
  session_duration_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid;
  category_record public.work_categories%rowtype;
  linked_task_record public.tasks%rowtype;
  session_id uuid := gen_random_uuid();
  completed_time timestamptz;
  planned_seconds integer;
  previous_total bigint;
  new_total bigint;
  awarded_rows integer := 0;
  character_awarded boolean := false;
begin
  current_member_id := private.current_member_id(target_organization_id);
  if current_member_id is null then
    raise exception 'Organization access required' using errcode = '42501';
  end if;

  if session_mode not in ('pomodoro', 'freeform') then
    raise exception 'Invalid focus mode';
  end if;
  if char_length(btrim(session_work_name)) < 1
    or char_length(session_work_name) > 160 then
    raise exception 'Work name is required';
  end if;
  if char_length(btrim(session_work_description)) < 1
    or char_length(session_work_description) > 2000 then
    raise exception 'Work description is required';
  end if;
  if session_duration_seconds < 60 or session_duration_seconds > 12 * 60 * 60 then
    raise exception 'Duration must be between 1 minute and 12 hours';
  end if;
  if session_started_at > now() then
    raise exception 'Past focus sessions cannot start in the future';
  end if;

  completed_time := session_started_at + make_interval(secs => session_duration_seconds);
  if completed_time > now() then
    raise exception 'Past focus sessions cannot end in the future';
  end if;

  select *
  into category_record
  from public.work_categories
  where id = session_work_category_id
    and organization_id = target_organization_id
    and archived_at is null;
  if category_record.id is null then
    raise exception 'Work category not found';
  end if;

  if session_linked_task_id is not null then
    select *
    into linked_task_record
    from public.tasks
    where id = session_linked_task_id
      and organization_id = target_organization_id
      and archived_at is null;
    if linked_task_record.id is null then
      raise exception 'Linked task not found';
    end if;
  end if;

  perform organization.id
  from public.organizations as organization
  where organization.id = target_organization_id
  for update;

  select coalesce(sum(points), 0)
  into previous_total
  from public.xp_events
  where organization_id = target_organization_id;

  planned_seconds := case when session_mode = 'pomodoro' then 1500 else null end;

  insert into public.focus_sessions (
    id,
    organization_id,
    member_id,
    work_name,
    work_description,
    work_category_id,
    work_category_name,
    linked_task_id,
    mode,
    kind,
    state,
    planned_duration_seconds,
    started_at,
    resumed_at,
    ends_at,
    remaining_seconds_at_pause,
    elapsed_seconds_at_pause,
    recorded_duration_seconds,
    completed_at,
    created_at,
    updated_at
  )
  values (
    session_id,
    target_organization_id,
    current_member_id,
    btrim(session_work_name),
    btrim(session_work_description),
    category_record.id,
    category_record.name,
    session_linked_task_id,
    session_mode,
    'focus',
    'completed',
    planned_seconds,
    session_started_at,
    null,
    null,
    null,
    session_duration_seconds,
    session_duration_seconds,
    completed_time,
    now(),
    now()
  );

  if session_mode = 'pomodoro' and session_duration_seconds >= 1500 then
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
      target_organization_id,
      'focus_session_completed',
      10,
      'focus_session',
      session_id,
      'focus_session_completed:' || session_id::text,
      current_member_id,
      'Completed Pomodoro focus: ' || btrim(session_work_name),
      jsonb_build_object(
        'duration_seconds',
        session_duration_seconds,
        'logged_after_completion',
        true
      )
    )
    on conflict (organization_id, idempotency_key) do nothing;
    get diagnostics awarded_rows = row_count;

    character_awarded := private.award_character_xp(
      target_organization_id,
      current_member_id,
      'focus_session_completed',
      10,
      'focus_session',
      session_id,
      'focus_session_completed:' || session_id::text,
      current_member_id,
      'Completed focus session: ' || btrim(session_work_name),
      jsonb_build_object(
        'duration_seconds',
        session_duration_seconds,
        'logged_after_completion',
        true
      )
    );
  end if;

  select coalesce(sum(points), 0)
  into new_total
  from public.xp_events
  where organization_id = target_organization_id;

  return jsonb_build_object(
    'session_id', session_id,
    'recorded_duration_seconds', session_duration_seconds,
    'xp_awarded', awarded_rows = 1,
    'character_xp_awarded', character_awarded,
    'previous_level', private.studio_level(previous_total),
    'new_level', private.studio_level(new_total)
  );
end;
$$;

revoke all on function public.record_past_focus_session(
  uuid,
  public.focus_mode,
  text,
  text,
  uuid,
  uuid,
  timestamptz,
  integer
) from public, anon;

grant execute on function public.record_past_focus_session(
  uuid,
  public.focus_mode,
  text,
  text,
  uuid,
  uuid,
  timestamptz,
  integer
) to authenticated;
