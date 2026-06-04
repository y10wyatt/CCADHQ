create index finance_entries_category_org_type_idx
  on public.finance_entries(category_id, organization_id, entry_type);

create index finance_entries_creator_org_idx
  on public.finance_entries(created_by_member_id, organization_id);

create index tasks_assignee_org_idx
  on public.tasks(assignee_member_id, organization_id);

create index tasks_creator_org_idx
  on public.tasks(created_by_member_id, organization_id);

create index tasks_category_org_idx
  on public.tasks(work_category_id, organization_id);

create index xp_events_actor_org_idx
  on public.xp_events(actor_member_id, organization_id);
