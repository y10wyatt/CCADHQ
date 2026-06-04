select set_config('app.change_source', 'migration', true);

alter table public.focus_sessions
add column work_category_name text;

alter table public.focus_sessions
add constraint focus_sessions_work_category_name_check check (
  (
    kind = 'focus'
    and work_category_name is not null
    and char_length(btrim(work_category_name)) > 0
  )
  or (
    kind <> 'focus'
    and work_category_name is null
  )
);

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
  current_time timestamptz := now();
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
    current_time,
    case when session_mode = 'freeform' then current_time end,
    case when session_mode = 'pomodoro' then current_time + make_interval(secs => duration_seconds) end
  )
  returning id into new_session_id;

  return new_session_id;
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
  category_snapshot text;
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

  select name
  into category_snapshot
  from public.work_categories
  where id = session_work_category_id
    and organization_id = session_record.organization_id
    and archived_at is null;

  if category_snapshot is null then
    raise exception 'Active work category required';
  end if;

  update public.focus_sessions
  set work_name = btrim(session_work_name),
      work_description = btrim(session_work_description),
      work_category_id = session_work_category_id,
      work_category_name = category_snapshot,
      linked_task_id = session_linked_task_id
  where id = target_session_id;
end;
$$;
