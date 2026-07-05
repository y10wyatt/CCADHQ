create or replace function public.get_studio_xp_total(
  target_organization_id uuid
)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(event.points), 0)::bigint
  from public.xp_events as event
  where event.organization_id = target_organization_id;
$$;

revoke all on function public.get_studio_xp_total(uuid) from public, anon;
grant execute on function public.get_studio_xp_total(uuid) to authenticated;

create or replace function public.get_dashboard_overview(
  target_organization_id uuid,
  month_start date,
  month_end date
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'outstanding_task_count', (
      select count(*)
      from public.tasks
      where organization_id = target_organization_id
        and status <> 'done'
        and archived_at is null
    ),
    'priority_task_count', (
      select count(*)
      from public.tasks
      where organization_id = target_organization_id
        and status <> 'done'
        and priority in ('high', 'urgent')
        and archived_at is null
    ),
    'total_xp', (
      select coalesce(sum(points), 0)
      from public.xp_events
      where organization_id = target_organization_id
    ),
    'recent_xp', coalesce((
      select jsonb_agg(to_jsonb(recent_event))
      from (
        select id, description, points, actor_member_id, created_at
        from public.xp_events
        where organization_id = target_organization_id
        order by created_at desc
        limit 5
      ) as recent_event
    ), '[]'::jsonb),
    'finance_entries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'entry_type', entry_type,
          'amount_minor', amount_minor
        )
      )
      from public.finance_entries
      where organization_id = target_organization_id
        and entry_date >= month_start
        and entry_date < month_end
        and archived_at is null
    ), '[]'::jsonb),
    'leads', coalesce((
      select jsonb_agg(to_jsonb(lead))
      from public.leads as lead
      where organization_id = target_organization_id
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', member.id,
          'display_name', profile.display_name,
          'avatar_url', profile.avatar_url
        )
        order by member.joined_at
      )
      from public.organization_members as member
      join public.profiles as profile on profile.id = member.user_id
      where member.organization_id = target_organization_id
        and member.is_active = true
    ), '[]'::jsonb),
    'character_xp_events', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'member_id', member_id,
          'event_type', event_type,
          'points', points
        )
      )
      from public.character_xp_events
      where organization_id = target_organization_id
    ), '[]'::jsonb),
    'weekly_quests', coalesce((
      select jsonb_agg(to_jsonb(quest))
      from public.weekly_quests as quest
      where organization_id = target_organization_id
        and status = 'active'
    ), '[]'::jsonb),
    'students', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'status', status,
          'follow_up_needed', follow_up_needed,
          'remaining_class_credits', remaining_class_credits
        )
      )
      from (
        select id, name, status, follow_up_needed, remaining_class_credits
        from public.students
        where organization_id = target_organization_id
          and archived_at is null
          and status <> 'Completed'
        order by follow_up_needed desc, next_class_date nulls last
        limit 30
      ) as student_record
    ), '[]'::jsonb),
    'class_sessions', coalesce((
      select jsonb_agg(to_jsonb(session_record) order by scheduled_start)
      from (
        select id, student_id, scheduled_start, status, lesson_goal
        from public.class_sessions
        where organization_id = target_organization_id
          and status in ('planned', 'in_progress')
        order by scheduled_start
        limit 30
      ) as session_record
    ), '[]'::jsonb),
    'student_action_items', coalesce((
      select jsonb_agg(to_jsonb(action_record) order by due_date nulls last)
      from (
        select id, student_id, title, due_date, assigned_to
        from public.student_action_items
        where organization_id = target_organization_id
          and status = 'open'
        order by due_date nulls last
        limit 30
      ) as action_record
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_dashboard_overview(uuid, date, date)
from public, anon;
grant execute on function public.get_dashboard_overview(uuid, date, date)
to authenticated;
