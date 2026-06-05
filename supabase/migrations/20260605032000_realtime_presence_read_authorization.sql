drop policy if exists organization_members_receive_presence on realtime.messages;

create policy organization_members_receive_presence
on realtime.messages for select to authenticated
using (
  realtime.messages.extension in ('broadcast', 'presence')
  and (select private.can_access_presence_topic())
);
