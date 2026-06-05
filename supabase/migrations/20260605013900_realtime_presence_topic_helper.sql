create or replace function private.can_access_presence_topic()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when realtime.topic() ~
      '^org:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}:presence$'
    then (
      select private.is_org_member(
        split_part(realtime.topic(), ':', 2)::uuid
      )
    )
    else false
  end
$$;

revoke all on function private.can_access_presence_topic() from public;
grant execute on function private.can_access_presence_topic() to authenticated;
