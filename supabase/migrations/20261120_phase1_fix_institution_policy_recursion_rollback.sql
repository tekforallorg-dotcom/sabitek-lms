-- =============================================================================
-- Rollback for 20261120_phase1_fix_institution_policy_recursion.sql
-- =============================================================================
-- Restores the two original self-referencing policies. Doing so brings back
-- the "infinite recursion detected in policy" error for browser queries on
-- institutions, institution_members, programs and the invite tables.
-- =============================================================================

begin;

drop policy if exists institution_members_admin_manage on public.institution_members;
drop policy if exists institution_members_staff_select on public.institution_members;

create policy "Institution admins can manage members" on public.institution_members
  for all to public
  using (
    exists (
      select 1 from institution_members admin_check
      where admin_check.institution_id = institution_members.institution_id
        and admin_check.user_id = auth.uid()
        and admin_check.role = 'institution_admin'::institution_role
        and admin_check.status = 'active'::institution_member_status
    )
  );

create policy "Institution admins can view institution members" on public.institution_members
  for select to public
  using (
    exists (
      select 1 from institution_members admin_check
      where admin_check.institution_id = institution_members.institution_id
        and admin_check.user_id = auth.uid()
        and admin_check.role = any (array['institution_admin'::institution_role, 'program_manager'::institution_role])
        and admin_check.status = 'active'::institution_member_status
    )
  );

drop function if exists public.has_institution_role(uuid, text[]);

commit;
