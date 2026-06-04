revoke all on function public.create_organization_invitation(
  uuid,
  text,
  public.member_role
) from anon;
revoke all on function public.revoke_organization_invitation(uuid) from anon;
revoke all on function public.update_organization_member_access(
  uuid,
  public.member_role,
  boolean
) from anon;
