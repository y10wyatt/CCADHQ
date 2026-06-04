create index audit_events_actor_member_idx
  on public.audit_events(actor_member_id);

create index change_history_actor_member_idx
  on public.change_history(actor_member_id);

create index change_history_actor_user_idx
  on public.change_history(actor_user_id);

create index organization_invitations_invited_by_member_idx
  on public.organization_invitations(invited_by_member_id);

create index work_categories_created_by_member_idx
  on public.work_categories(created_by_member_id);
