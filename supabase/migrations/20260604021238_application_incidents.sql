select set_config('app.change_source', 'migration', true);

create table public.application_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  member_id uuid not null,
  incident_key uuid not null,
  source text not null check (
    source in (
      'workspace_boundary',
      'global_boundary',
      'client_unhandled_error',
      'client_unhandled_rejection'
    )
  ),
  route text not null check (
    char_length(btrim(route)) > 0 and char_length(route) <= 300
  ),
  digest text check (digest is null or char_length(digest) <= 200),
  deployment_id text check (
    deployment_id is null or char_length(deployment_id) <= 200
  ),
  created_at timestamptz not null default now(),
  unique (organization_id, incident_key),
  foreign key (member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict
);

create index application_incidents_org_created_idx
  on public.application_incidents(organization_id, created_at desc);
create index application_incidents_member_org_idx
  on public.application_incidents(member_id, organization_id);

create trigger application_incidents_change_history
after insert or update or delete on public.application_incidents
for each row execute function private.record_change_history();

create or replace function public.record_application_incident(
  target_incident_key uuid,
  incident_source text,
  incident_route text,
  incident_digest text default null,
  incident_deployment_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_record public.organization_members%rowtype;
  recorded_id uuid;
begin
  select *
  into member_record
  from public.organization_members
  where user_id = (select auth.uid())
    and is_active
  order by joined_at
  limit 1;

  if member_record.id is null then
    raise exception 'Active organization membership required' using errcode = '42501';
  end if;

  insert into public.application_incidents (
    organization_id,
    member_id,
    incident_key,
    source,
    route,
    digest,
    deployment_id
  )
  values (
    member_record.organization_id,
    member_record.id,
    target_incident_key,
    incident_source,
    btrim(incident_route),
    nullif(btrim(incident_digest), ''),
    nullif(btrim(incident_deployment_id), '')
  )
  on conflict (organization_id, incident_key) do nothing
  returning id into recorded_id;

  if recorded_id is null then
    select id
    into recorded_id
    from public.application_incidents
    where organization_id = member_record.organization_id
      and incident_key = target_incident_key;
  end if;

  return recorded_id;
end;
$$;

alter table public.application_incidents enable row level security;
revoke all on public.application_incidents from anon, authenticated;
grant select on public.application_incidents to authenticated;

create policy application_incidents_select_admins
on public.application_incidents for select to authenticated
using ((select private.is_org_admin(organization_id)));

revoke all on function public.record_application_incident(
  uuid, text, text, text, text
) from public, anon;
grant execute on function public.record_application_incident(
  uuid, text, text, text, text
) to authenticated;
