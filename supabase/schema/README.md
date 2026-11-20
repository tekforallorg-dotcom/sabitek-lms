# Database schema reference

Most of the Sabitek schema was created by hand in the Supabase SQL editor and
never recorded as migrations. These files put the real schema under version
control.

| File | What it is |
|---|---|
| `schema_snapshot.sql` | The live `public` schema (plus `storage.objects` policies), generated from the system catalogs. A reference for review and diffing, not a replayable dump. |
| `generate_snapshot.sql` | The query that produces the snapshot. Run it in the SQL editor and save the single value it returns. |
| `../../types/supabase.ts` | TypeScript types generated from the same database. |

## After every schema change

1. Add a migration file under `supabase/migrations/` (with a rollback where practical) and apply it.
2. Regenerate the snapshot with `generate_snapshot.sql`.
3. Regenerate the types:

   ```bash
   npx supabase gen types typescript --project-id jlylhwytecmhpaekffws > types/supabase.ts
   ```

4. Commit all three together, so the diff shows exactly what changed.

## Using the types

`types/supabase.ts` exports `Database` and the helpers `Tables<'name'>`,
`TablesInsert<'name'>`, `TablesUpdate<'name'>` and `Enums<'name'>`:

```ts
import type { Tables } from '@/types/supabase'

type Course = Tables<'courses'>
```

The server-side client (`supabaseAdmin` in `lib/supabase-admin.ts`) is typed
with `Database`, so a query that names a table or column that does not exist
fails the type-check and CI instead of failing silently in production.

Two deliberate gaps:

- `supabaseAdminUntyped` is the same client without types. It is used only by
  areas scheduled for removal or rebuild (SabiWrite, the mobile API, Community,
  SabiQuiz) and by the one admin query whose table name is chosen at runtime.
  Do not use it in new code.
- The browser client (`lib/supabase.ts`) is not typed yet. Typing it surfaces
  about 80 more mismatches in page components, which are being reworked.
