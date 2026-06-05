drop policy if exists organization_members_send_presence on realtime.messages;

create policy organization_members_send_presence
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension in ('broadcast', 'presence')
  and (select private.can_access_presence_topic())
);
