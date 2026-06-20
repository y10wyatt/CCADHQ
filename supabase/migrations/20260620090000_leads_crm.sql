create type public.lead_status as enum (
  'New Inquiry',
  'Contacted',
  'Consultation Booked',
  'Trial Class',
  'Proposal Sent',
  'Enrolled',
  'Lost'
);

create type public.lead_source as enum (
  'Website',
  'Referral',
  'Xiaohongshu',
  'Instagram',
  'Workshop',
  'RISD Event',
  'Other'
);

create type public.lead_assigned_staff as enum ('William', 'Alice', 'Gerald', 'Team', 'Other');

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  student_name text not null check (char_length(btrim(student_name)) > 0),
  grade text not null default '',
  school text not null default '',
  parent_name text not null default '',
  parent_email text not null default '',
  parent_phone text not null default '',
  program_interest text not null default '',
  target_schools text[] not null default '{}',
  goals text not null default '',
  timeline text not null default '',
  source public.lead_source not null default 'Other',
  status public.lead_status not null default 'New Inquiry',
  potential_revenue_minor integer not null default 0 check (potential_revenue_minor >= 0),
  assigned_staff public.lead_assigned_staff not null default 'Team',
  last_contacted_date date,
  next_follow_up_date date,
  notes text not null default '',
  converted_student_id uuid references public.students(id) on delete set null,
  converted_at timestamptz,
  archived_at timestamptz,
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.students
add column original_lead_id uuid references public.leads(id) on delete set null;

create table public.lead_activity_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null references public.leads(id) on delete cascade,
  activity_date date not null default current_date,
  title text not null check (char_length(btrim(title)) > 0),
  notes text not null default '',
  created_by_member_id uuid not null references public.organization_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_org_status_idx
on public.leads(organization_id, status, archived_at, updated_at desc);

create index leads_org_follow_up_idx
on public.leads(organization_id, next_follow_up_date, status)
where archived_at is null;

create index leads_org_source_idx
on public.leads(organization_id, source, status)
where archived_at is null;

create index students_original_lead_idx
on public.students(original_lead_id)
where original_lead_id is not null;

create index lead_activity_entries_lead_date_idx
on public.lead_activity_entries(lead_id, activity_date desc, created_at desc);

create trigger leads_set_updated_at
before update on public.leads
for each row execute function private.set_updated_at();

create trigger lead_activity_entries_set_updated_at
before update on public.lead_activity_entries
for each row execute function private.set_updated_at();

alter table public.leads enable row level security;
alter table public.lead_activity_entries enable row level security;

create policy "organization members can read leads"
on public.leads for select
to authenticated
using (private.is_org_member(organization_id));

create policy "organization members can write leads"
on public.leads for all
to authenticated
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

create policy "organization members can read lead activity"
on public.lead_activity_entries for select
to authenticated
using (private.is_org_member(organization_id));

create policy "organization members can write lead activity"
on public.lead_activity_entries for all
to authenticated
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.lead_activity_entries to authenticated;

create trigger leads_change_history
after insert or update or delete on public.leads
for each row execute function private.record_change_history();

create trigger lead_activity_entries_change_history
after insert or update or delete on public.lead_activity_entries
for each row execute function private.record_change_history();
