create or replace function private.can_access_presence_topic()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when current_setting('realtime.topic', true) ~
      '^org:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}:presence$'
    then (
      select private.is_org_member(
        split_part(current_setting('realtime.topic', true), ':', 2)::uuid
      )
    )
    else false
  end
$$;

revoke all on function private.can_access_presence_topic() from public;
grant execute on function private.can_access_presence_topic() to authenticated;

create policy organization_members_receive_presence
on realtime.messages for select to authenticated
using (
  realtime.messages.extension = 'presence'
  and (select private.can_access_presence_topic())
);

create policy organization_members_send_presence
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension = 'presence'
  and (select private.can_access_presence_topic())
);
