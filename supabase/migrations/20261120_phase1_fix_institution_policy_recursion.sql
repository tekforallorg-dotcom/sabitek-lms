-- =============================================================================
-- Phase 1: fix infinite recursion in institution_members policies
-- =============================================================================
-- Two policies on public.institution_members decided access by querying
-- public.institution_members again. Postgres detects that as infinite
-- recursion (error 42P17) and fails the whole statement.
--
-- Because policies on institutions, programs, cohort_invites and
-- institution_invites all look at institution_members, EVERY signed-in browser
-- query touching any of those tables failed. The app has been working around
-- it by sending those reads through service-role API routes.
--
-- Fix: move the membership check into a SECURITY DEFINER function, which reads
-- the table without re-entering its policies. The rules are unchanged:
--   * an institution admin can manage (read and write) their institution's
--     members;
--   * institution admins and program managers can read them.
-- The other three policies on the table do not self-reference and are kept.
--
-- No application code depends on this; it only makes the policies work as
-- they were written.
--
-- Rollback: 20261120_phase1_fix_institution_policy_recursion_rollback.sql
-- =============================================================================

begin;

-- Does the signed-in caller hold one of these roles, actively, in this institution?
create or replace function public.has_institution_role(p_institution uuid, p_roles text[])
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select exists (
    select 1
    from institution_members m
    where m.institution_id = p_institution
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role::text = any (p_roles)
  );
$function$;

revoke execute on function public.has_institution_role(uuid, text[]) from public, anon;
grant execute on function public.has_institution_role(uuid, text[]) to authenticated, service_role;

drop policy if exists "Institution admins can manage members" on public.institution_members;

create policy institution_members_admin_manage on public.institution_members
  for all to authenticated
  using (public.has_institution_role(institution_id, array['institution_admin']))
  with check (public.has_institution_role(institution_id, array['institution_admin']));

drop policy if exists "Institution admins can view institution members" on public.institution_members;

create policy institution_members_staff_select on public.institution_members
  for select to authenticated
  using (public.has_institution_role(institution_id, array['institution_admin', 'program_manager']));

commit;
