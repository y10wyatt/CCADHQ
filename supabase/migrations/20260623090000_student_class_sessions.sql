create type public.class_session_status as enum (
  'planned',
  'in_progress',
  'completed',
  'reported',
  'excused_absence',
  'unexcused_absence',
  'cancelled',
  'rescheduled'
);

create type public.attendance_status as enum (
  'pending',
  'attended',
  'excused_absence',
  'unexcused_absence',
  'cancelled',
  'rescheduled'
);

create type public.action_item_assigned_to as enum ('teacher', 'student');
create type public.action_item_status as enum ('open', 'completed', 'dismissed');

alter table public.students
add column remaining_class_credits integer not null default 0
check (remaining_class_credits >= 0);

create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_id uuid,
  series_id uuid,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status public.class_session_status not null default 'planned',
  attendance_status public.attendance_status not null default 'pending',
  deducts_credit boolean not null default false,
  lesson_goal text not null default '',
  plan_notes text not null default '',
  materials_needed text not null default '',
  teacher_private_notes text not null default '',
  actual_summary text not null default '',
  student_progress text not null default '',
  homework_assigned text not null default '',
  no_homework boolean not null default false,
  parent_facing_summary text not null default '',
  internal_teacher_notes text not null default '',
  next_class_recommendation text not null default '',
  progress_tags text[] not null default '{}',
  parent_report_sent_at timestamptz,
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end > scheduled_start)
);

create table public.student_action_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  class_session_id uuid references public.class_sessions(id) on delete set null,
  assigned_to public.action_item_assigned_to not null,
  title text not null check (char_length(btrim(title)) > 0),
  description text not null default '',
  due_date date,
  status public.action_item_status not null default 'open',
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index class_sessions_student_schedule_idx
on public.class_sessions(student_id, scheduled_start);

create index class_sessions_org_status_idx
on public.class_sessions(organization_id, status, scheduled_start);

create index student_action_items_student_status_idx
on public.student_action_items(student_id, status, assigned_to);

create trigger class_sessions_set_updated_at
before update on public.class_sessions
for each row execute function private.set_updated_at();

create trigger student_action_items_set_updated_at
before update on public.student_action_items
for each row execute function private.set_updated_at();

alter table public.class_sessions enable row level security;
alter table public.student_action_items enable row level security;

create policy "organization members can read class sessions"
on public.class_sessions for select
to authenticated
using (private.is_org_member(organization_id));

create policy "organization members can write class sessions"
on public.class_sessions for all
to authenticated
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

create policy "organization members can read student action items"
on public.student_action_items for select
to authenticated
using (private.is_org_member(organization_id));

create policy "organization members can write student action items"
on public.student_action_items for all
to authenticated
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

grant select, insert, update, delete on public.class_sessions to authenticated;
grant select, insert, update, delete on public.student_action_items to authenticated;

create trigger class_sessions_change_history
after insert or update or delete on public.class_sessions
for each row execute function private.record_change_history();

create trigger student_action_items_change_history
after insert or update or delete on public.student_action_items
for each row execute function private.record_change_history();
