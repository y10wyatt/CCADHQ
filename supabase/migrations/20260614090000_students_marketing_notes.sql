create type public.student_program as enum ('Portfolio', 'AP Drawing', 'Animation', 'Trial', 'Other');
create type public.student_status as enum ('Active', 'Trial', 'Paused', 'Completed');
create type public.permission_to_post as enum ('Yes', 'No', 'Pending');
create type public.class_log_teacher as enum ('William', 'Alice', 'Gerald', 'Other');
create type public.marketing_account as enum ('CCAD', 'William', 'Alice', 'Mascot');
create type public.marketing_owner as enum ('William', 'Alice', 'Team', 'Other');
create type public.marketing_priority as enum ('Low', 'Medium', 'High');
create type public.marketing_status as enum (
  'Idea Bank',
  'Selected This Week',
  'Script Needed',
  'Ready to Film',
  'Editing',
  'Scheduled',
  'Posted',
  'Review Performance'
);
create type public.studio_note_author as enum ('William', 'Alice', 'Team');
create type public.studio_note_category as enum (
  'Reminder',
  'Content Idea',
  'Student Follow-up',
  'Admin',
  'Website',
  'Marketing',
  'Random'
);
create type public.studio_note_priority as enum ('Normal', 'Important');

create table public.students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (char_length(btrim(name)) > 0),
  grade text not null default '',
  program public.student_program not null default 'Portfolio',
  status public.student_status not null default 'Active',
  main_goal text not null default '',
  current_focus text not null default '',
  next_action text not null default '',
  next_class_date date,
  last_class_date date,
  follow_up_needed boolean not null default false,
  permission_to_post public.permission_to_post not null default 'Pending',
  notes text not null default '',
  strengths text[] not null default '{}',
  needs_support text[] not null default '{}',
  application_targets text[] not null default '{}',
  parent_notes text not null default '',
  payment_notes text not null default '',
  archived_at timestamptz,
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  log_date date not null default current_date,
  teacher public.class_log_teacher not null default 'William',
  duration text not null default '',
  worked_on text not null default '',
  feedback_given text not null default '',
  homework_assigned text not null default '',
  materials_needed text not null default '',
  parent_update_sent boolean not null default false,
  next_class_focus text not null default '',
  image_url text,
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketing_content_ideas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  title text not null check (char_length(btrim(title)) > 0),
  account public.marketing_account not null default 'CCAD',
  owner public.marketing_owner not null default 'Team',
  content_lane text not null default '',
  audience text not null default '',
  format text not null default '',
  priority public.marketing_priority not null default 'Medium',
  deadline date,
  cta text not null default '',
  status public.marketing_status not null default 'Idea Bank',
  notes text not null default '',
  archived_at timestamptz,
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.studio_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  note_text text not null check (char_length(btrim(note_text)) > 0),
  author public.studio_note_author not null default 'Team',
  category public.studio_note_category not null default 'Reminder',
  priority public.studio_note_priority not null default 'Normal',
  pinned boolean not null default false,
  archived_at timestamptz,
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index students_org_archived_idx on public.students(organization_id, archived_at);
create index class_logs_student_date_idx on public.class_logs(student_id, log_date desc);
create index marketing_content_ideas_org_status_idx on public.marketing_content_ideas(organization_id, status, archived_at);
create index studio_notes_org_pinned_idx on public.studio_notes(organization_id, pinned desc, created_at desc) where archived_at is null;

create trigger students_set_updated_at
before update on public.students
for each row execute function private.set_updated_at();

create trigger class_logs_set_updated_at
before update on public.class_logs
for each row execute function private.set_updated_at();

create trigger marketing_content_ideas_set_updated_at
before update on public.marketing_content_ideas
for each row execute function private.set_updated_at();

create trigger studio_notes_set_updated_at
before update on public.studio_notes
for each row execute function private.set_updated_at();

with org_seed_member as (
  select distinct on (organization_id)
    organization_id,
    id as member_id
  from public.organization_members
  order by organization_id, created_at
)
insert into public.studio_notes (
  organization_id,
  note_text,
  author,
  category,
  priority,
  pinned,
  created_by_member_id
)
select
  org_seed_member.organization_id,
  note.note_text,
  note.author::public.studio_note_author,
  note.category::public.studio_note_category,
  note.priority::public.studio_note_priority,
  note.pinned,
  org_seed_member.member_id
from org_seed_member
cross join (
  values
    ('Remember to photograph student process work this weekend.', 'William', 'Marketing', 'Important', true),
    ('Ask Alice if we should make a parent FAQ post about beginner students.', 'William', 'Content Idea', 'Normal', false),
    ('Need to confirm which student works can be posted publicly.', 'Team', 'Admin', 'Important', true),
    ('Add Marketing dashboard tab for account identities and content roadmap.', 'William', 'Website', 'Important', true)
) as note(note_text, author, category, priority, pinned)
where not exists (
  select 1
  from public.studio_notes existing_note
  where existing_note.organization_id = org_seed_member.organization_id
);

alter table public.students enable row level security;
alter table public.class_logs enable row level security;
alter table public.marketing_content_ideas enable row level security;
alter table public.studio_notes enable row level security;

create policy "organization members can read students"
on public.students for select
to authenticated
using (private.is_org_member(organization_id));

create policy "organization members can write students"
on public.students for all
to authenticated
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

create policy "organization members can read class logs"
on public.class_logs for select
to authenticated
using (private.is_org_member(organization_id));

create policy "organization members can write class logs"
on public.class_logs for all
to authenticated
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

create policy "organization members can read marketing ideas"
on public.marketing_content_ideas for select
to authenticated
using (private.is_org_member(organization_id));

create policy "organization members can write marketing ideas"
on public.marketing_content_ideas for all
to authenticated
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

create policy "organization members can read studio notes"
on public.studio_notes for select
to authenticated
using (private.is_org_member(organization_id));

create policy "organization members can write studio notes"
on public.studio_notes for all
to authenticated
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.class_logs to authenticated;
grant select, insert, update, delete on public.marketing_content_ideas to authenticated;
grant select, insert, update, delete on public.studio_notes to authenticated;

create trigger students_change_history
after insert or update or delete on public.students
for each row execute function private.record_change_history();

create trigger class_logs_change_history
after insert or update or delete on public.class_logs
for each row execute function private.record_change_history();

create trigger marketing_content_ideas_change_history
after insert or update or delete on public.marketing_content_ideas
for each row execute function private.record_change_history();

create trigger studio_notes_change_history
after insert or update or delete on public.studio_notes
for each row execute function private.record_change_history();
