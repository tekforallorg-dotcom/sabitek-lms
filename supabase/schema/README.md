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

The shared clients (`lib/supabase.ts`, `lib/supabase-admin.ts`) are not yet
typed with `Database`. Turning that on surfaces about 155 type errors across
50 files, most of them real mismatches between the code and the schema. They
are being fixed area by area; until then, use the row types explicitly as
above.
