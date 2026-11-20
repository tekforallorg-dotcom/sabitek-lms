-- Generates supabase/schema/schema_snapshot.sql.
--
-- Run this in the Supabase SQL editor (or any client), copy the single text
-- value it returns, and save it as schema_snapshot.sql next to this file.
--
-- It reads the system catalogs, so it reflects what is actually in the
-- database, including objects that were created by hand in the SQL editor and
-- never recorded as migrations. It covers the public schema plus the policies
-- on storage.objects.
--
-- The output is a REFERENCE for review and diffing. Statements are grouped by
-- kind, not ordered by dependency, so it is not guaranteed to replay cleanly
-- into an empty database. For a replayable dump use `supabase db dump`.

select string_agg(ddl, E'\n\n' order by ord, name) as schema_snapshot
from (
  -- 1. enum types
  select 1 as ord, t.typname::text as name,
         format('create type public.%I as enum (%s);', t.typname,
                (select string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder)
                 from pg_enum e where e.enumtypid = t.oid)) as ddl
  from pg_type t
  where t.typnamespace = 'public'::regnamespace and t.typtype = 'e'

  union all
  -- 2. tables and columns
  select 2, c.relname::text,
         format(E'create table public.%I (\n%s\n);%s', c.relname,
                (select string_agg(
                          format('  %I %s%s%s', a.attname,
                                 format_type(a.atttypid, a.atttypmod),
                                 case when a.attnotnull then ' not null' else '' end,
                                 coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')),
                          E',\n' order by a.attnum)
                 from pg_attribute a
                 left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
                 where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped),
                coalesce(E'\ncomment on table public.' || quote_ident(c.relname) || ' is '
                         || quote_literal(obj_description(c.oid, 'pg_class')) || ';', ''))
  from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'

  union all
  -- 3. primary key, unique and check constraints; 4. foreign keys
  select case when con.contype = 'f' then 4 else 3 end,
         c.relname || '.' || con.conname,
         format('alter table public.%I add constraint %I %s;', c.relname, con.conname,
                pg_get_constraintdef(con.oid))
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  where con.connamespace = 'public'::regnamespace and c.relkind = 'r'

  union all
  -- 5. indexes that do not back a constraint
  select 5, i.indexname::text, i.indexdef || ';'
  from pg_indexes i
  where i.schemaname = 'public'
    and not exists (
      select 1 from pg_constraint con
      where con.connamespace = 'public'::regnamespace and con.conname = i.indexname
    )

  union all
  -- 6. functions
  select 6, p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         pg_get_functiondef(p.oid) || ';'
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'

  union all
  -- 7. views
  select 7, v.viewname::text,
         format(E'create or replace view public.%I as\n%s', v.viewname, v.definition)
  from pg_views v
  where v.schemaname = 'public'

  union all
  -- 8. triggers (public tables, plus the sign-up trigger on auth.users)
  select 8, c.relname || '.' || t.tgname, pg_get_triggerdef(t.oid) || ';'
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_proc p on p.oid = t.tgfoid
  where not t.tgisinternal
    and (c.relnamespace = 'public'::regnamespace
         or (c.relnamespace = 'auth'::regnamespace and p.pronamespace = 'public'::regnamespace))

  union all
  -- 9. row level security switches
  select 9, c.relname::text,
         format('alter table public.%I enable row level security;', c.relname)
  from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relrowsecurity

  union all
  -- 10. policies (public tables and storage.objects)
  select 10, pol.schemaname || '.' || pol.tablename || '.' || pol.policyname,
         format('create policy %I on %I.%I as %s for %s to %s%s%s;',
                pol.policyname, pol.schemaname, pol.tablename, lower(pol.permissive),
                lower(pol.cmd), array_to_string(pol.roles, ', '),
                coalesce(E'\n  using (' || pol.qual || ')', ''),
                coalesce(E'\n  with check (' || pol.with_check || ')', ''))
  from pg_policies pol
  where pol.schemaname = 'public'
     or (pol.schemaname = 'storage' and pol.tablename = 'objects')

  union all
  -- 11. table privileges of the browser-facing roles
  select 11, g.table_name || '.' || g.grantee,
         format('-- %s on public.%I: %s', g.grantee, g.table_name,
                string_agg(lower(g.privilege_type), ', ' order by g.privilege_type))
  from information_schema.role_table_grants g
  where g.table_schema = 'public' and g.grantee in ('anon', 'authenticated')
  group by g.table_name, g.grantee

  union all
  -- 12. column-level update privileges (only tables where they are restricted)
  select 12, cp.table_name || '.' || cp.grantee,
         format('-- %s may update only these columns of public.%I: %s', cp.grantee, cp.table_name,
                string_agg(cp.column_name, ', ' order by cp.column_name))
  from information_schema.column_privileges cp
  where cp.table_schema = 'public' and cp.grantee in ('anon', 'authenticated')
    and cp.privilege_type = 'UPDATE'
    and not exists (
      select 1 from information_schema.role_table_grants g
      where g.table_schema = cp.table_schema and g.table_name = cp.table_name
        and g.grantee = cp.grantee and g.privilege_type = 'UPDATE'
    )
  group by cp.table_name, cp.grantee

  union all
  -- 13. which roles may execute each SECURITY DEFINER function
  select 13, p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         format('-- security definer %I(%s) executable by: %s', p.proname,
                pg_get_function_identity_arguments(p.oid),
                coalesce((select string_agg(r.rolname, ', ' order by r.rolname)
                          from pg_roles r
                          where r.rolname in ('anon', 'authenticated', 'service_role')
                            and has_function_privilege(r.oid, p.oid, 'EXECUTE')), 'nobody'))
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace and p.prosecdef
) parts;
