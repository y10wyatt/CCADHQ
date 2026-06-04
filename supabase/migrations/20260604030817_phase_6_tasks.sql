select set_config('app.change_source', 'migration', true);

alter table public.tasks
add column work_category_name text,
add column first_completed_at timestamptz;

update public.tasks as task
set work_category_name = category.name,
    first_completed_at = task.completed_at
from public.work_categories as category
where category.id = task.work_category_id
  and category.organization_id = task.organization_id;

alter table public.tasks
alter column work_category_name set not null;

alter table public.tasks
add constraint tasks_work_category_name_check check (
  char_length(btrim(work_category_name)) > 0
);

revoke all privileges on public.tasks from authenticated;
grant select on public.tasks to authenticated;

create or replace function public.create_task(
  target_organization_id uuid,
  task_title text,
  task_description text,
  task_work_category_id uuid,
  task_priority public.task_priority,
  task_assignee_member_id uuid default null,
  task_due_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid;
  category_snapshot text;
  new_task_id uuid;
begin
  current_member_id := private.current_member_id(target_organization_id);
  if current_member_id is null then
    raise exception 'Active organization membership required' using errcode = '42501';
  end if;

  select name into category_snapshot
  from public.work_categories
  where id = task_work_category_id
    and organization_id = target_organization_id
    and archived_at is null;
  if category_snapshot is null then
    raise exception 'Active work category required';
  end if;

  if task_assignee_member_id is not null and not exists (
    select 1 from public.organization_members
    where id = task_assignee_member_id
      and organization_id = target_organization_id
      and is_active
  ) then
    raise exception 'Active organization assignee required';
  end if;

  insert into public.tasks (
    organization_id,
    title,
    description,
    work_category_id,
    work_category_name,
    priority,
    assignee_member_id,
    due_at,
    created_by_member_id
  )
  values (
    target_organization_id,
    btrim(task_title),
    nullif(btrim(task_description), ''),
    task_work_category_id,
    category_snapshot,
    task_priority,
    task_assignee_member_id,
    task_due_at,
    current_member_id
  )
  returning id into new_task_id;

  return new_task_id;
end;
$$;

create or replace function public.update_task_details(
  target_task_id uuid,
  task_title text,
  task_description text,
  task_work_category_id uuid,
  task_priority public.task_priority,
  task_assignee_member_id uuid default null,
  task_due_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_record public.tasks%rowtype;
  category_snapshot text;
begin
  select * into task_record
  from public.tasks
  where id = target_task_id
  for update;
  if task_record.id is null
    or private.current_member_id(task_record.organization_id) is null then
    raise exception 'Task not found' using errcode = '42501';
  end if;
  if task_record.archived_at is not null then
    raise exception 'Archived tasks cannot be edited';
  end if;

  select name into category_snapshot
  from public.work_categories
  where id = task_work_category_id
    and organization_id = task_record.organization_id
    and archived_at is null;
  if category_snapshot is null then
    raise exception 'Active work category required';
  end if;

  if task_assignee_member_id is not null and not exists (
    select 1 from public.organization_members
    where id = task_assignee_member_id
      and organization_id = task_record.organization_id
      and is_active
  ) then
    raise exception 'Active organization assignee required';
  end if;

  update public.tasks
  set title = btrim(task_title),
      description = nullif(btrim(task_description), ''),
      work_category_id = task_work_category_id,
      work_category_name = category_snapshot,
      priority = task_priority,
      assignee_member_id = task_assignee_member_id,
      due_at = task_due_at
  where id = target_task_id;
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
  end if;

  select coalesce(sum(points), 0)
  into new_total
  from public.xp_events
  where organization_id = task_record.organization_id;

  return jsonb_build_object(
    'task_id', task_record.id,
    'status', target_status,
    'xp_awarded', awarded_rows = 1,
    'previous_level', private.studio_level(previous_total),
    'new_level', private.studio_level(new_total)
  );
end;
$$;

create or replace function public.archive_task(target_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_record public.tasks%rowtype;
begin
  select * into task_record
  from public.tasks
  where id = target_task_id
  for update;
  if task_record.id is null
    or private.current_member_id(task_record.organization_id) is null then
    raise exception 'Task not found' using errcode = '42501';
  end if;
  if task_record.archived_at is not null then
    return;
  end if;
  update public.tasks set archived_at = now() where id = target_task_id;
end;
$$;

revoke all on function public.create_task(
  uuid, text, text, uuid, public.task_priority, uuid, timestamptz
) from public, anon;
revoke all on function public.update_task_details(
  uuid, text, text, uuid, public.task_priority, uuid, timestamptz
) from public, anon;
revoke all on function public.transition_task(uuid, public.task_status)
  from public, anon;
revoke all on function public.archive_task(uuid) from public, anon;

grant execute on function public.create_task(
  uuid, text, text, uuid, public.task_priority, uuid, timestamptz
) to authenticated;
grant execute on function public.update_task_details(
  uuid, text, text, uuid, public.task_priority, uuid, timestamptz
) to authenticated;
grant execute on function public.transition_task(uuid, public.task_status)
  to authenticated;
grant execute on function public.archive_task(uuid) to authenticated;
