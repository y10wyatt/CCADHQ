create or replace function private.shares_org_with_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as mine
    join public.organization_members as theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and mine.is_active
      and theirs.user_id = target_user_id
  )
$$;

create or replace function public.create_organization_invitation(
  target_organization_id uuid,
  invitation_email text,
  invitation_role public.member_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_member_id uuid;
  normalized_email text;
  invitation_id uuid;
begin
  actor_member_id := private.current_member_id(target_organization_id);
  if actor_member_id is null
    or not private.is_org_admin(target_organization_id) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  normalized_email := lower(btrim(invitation_email));
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(normalized_email) > 320 then
    raise exception 'Valid email required' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.organization_members as member
    join auth.users as account on account.id = member.user_id
    where member.organization_id = target_organization_id
      and lower(account.email) = normalized_email
  ) then
    raise exception 'Email already belongs to an organization member'
      using errcode = '22023';
  end if;

  select id
  into invitation_id
  from public.organization_invitations
  where organization_id = target_organization_id
    and lower(email) = normalized_email
    and status = 'pending'
  for update;

  if invitation_id is null then
    insert into public.organization_invitations (
      organization_id,
      email,
      role,
      status,
      invited_by_member_id,
      expires_at
    )
    values (
      target_organization_id,
      normalized_email,
      invitation_role,
      'pending',
      actor_member_id,
      now() + interval '14 days'
    )
    returning id into invitation_id;
  else
    update public.organization_invitations
    set role = invitation_role,
        invited_by_member_id = actor_member_id,
        expires_at = now() + interval '14 days',
        updated_at = now()
    where id = invitation_id;
  end if;

  insert into public.audit_events (
    organization_id,
    actor_member_id,
    action,
    entity_type,
    entity_id,
    details
  )
  values (
    target_organization_id,
    actor_member_id,
    'organization_invitation_created',
    'organization_invitations',
    invitation_id,
    jsonb_build_object('email', normalized_email, 'role', invitation_role)
  );

  return invitation_id;
end;
$$;

create or replace function public.revoke_organization_invitation(
  target_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_record public.organization_invitations%rowtype;
  actor_member_id uuid;
begin
  select *
  into invitation_record
  from public.organization_invitations
  where id = target_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  actor_member_id := private.current_member_id(invitation_record.organization_id);
  if actor_member_id is null
    or not private.is_org_admin(invitation_record.organization_id) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if invitation_record.status <> 'pending' then
    return;
  end if;

  update public.organization_invitations
  set status = 'revoked',
      updated_at = now()
  where id = target_invitation_id;

  insert into public.audit_events (
    organization_id,
    actor_member_id,
    action,
    entity_type,
    entity_id,
    details
  )
  values (
    invitation_record.organization_id,
    actor_member_id,
    'organization_invitation_revoked',
    'organization_invitations',
    invitation_record.id,
    jsonb_build_object('email', invitation_record.email)
  );
end;
$$;

create or replace function public.update_organization_member_access(
  target_member_id uuid,
  target_role public.member_role,
  target_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_member public.organization_members%rowtype;
  actor_member_id uuid;
  active_admin_count integer;
begin
  select *
  into target_member
  from public.organization_members
  where id = target_member_id
  for update;

  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  actor_member_id := private.current_member_id(target_member.organization_id);
  if actor_member_id is null
    or not private.is_org_admin(target_member.organization_id) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if target_member.id = actor_member_id and not target_is_active then
    raise exception 'Admins cannot deactivate themselves'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(target_member.organization_id::text, 10)
  );

  if target_member.role = 'admin'
    and target_member.is_active
    and (target_role <> 'admin' or not target_is_active) then
    select count(*)
    into active_admin_count
    from public.organization_members
    where organization_id = target_member.organization_id
      and role = 'admin'
      and is_active;

    if active_admin_count <= 1 then
      raise exception 'At least one active admin is required'
        using errcode = '22023';
    end if;
  end if;

  if target_member.role = target_role
    and target_member.is_active = target_is_active then
    return;
  end if;

  update public.organization_members
  set role = target_role,
      is_active = target_is_active,
      updated_at = now()
  where id = target_member_id;

  insert into public.audit_events (
    organization_id,
    actor_member_id,
    action,
    entity_type,
    entity_id,
    details
  )
  values (
    target_member.organization_id,
    actor_member_id,
    'organization_member_access_updated',
    'organization_members',
    target_member.id,
    jsonb_build_object(
      'previous_role', target_member.role,
      'new_role', target_role,
      'previous_is_active', target_member.is_active,
      'new_is_active', target_is_active
    )
  );
end;
$$;

revoke insert, update on public.organization_members from authenticated;
revoke insert, update on public.organization_invitations from authenticated;

revoke all on function public.create_organization_invitation(
  uuid,
  text,
  public.member_role
) from public, anon;
revoke all on function public.revoke_organization_invitation(uuid)
  from public, anon;
revoke all on function public.update_organization_member_access(
  uuid,
  public.member_role,
  boolean
) from public, anon;

grant execute on function public.create_organization_invitation(
  uuid,
  text,
  public.member_role
) to authenticated;
grant execute on function public.revoke_organization_invitation(uuid)
  to authenticated;
grant execute on function public.update_organization_member_access(
  uuid,
  public.member_role,
  boolean
) to authenticated;
