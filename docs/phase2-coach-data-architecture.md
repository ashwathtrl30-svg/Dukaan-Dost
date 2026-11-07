# Coach Phase 2 — identity and persistence foundation

## Current implementation status

This branch contains the Coach schema candidate, typed persistence repository, input validation and regression tests. The cloud repository is explicitly disabled unless `VITE_COACH_CLOUD_ENABLED=true`. The feature preview branch sets it to `false`.

The SQL has **not** been applied to any Supabase project. The existing live Dukaan Dost project is intentionally excluded.

## Data ownership model

- `coach_workspaces` stores shared shop context (shop name, category and city) and is owned by one Supabase Auth user.
- `coach_workspace_memberships` allows a shop owner to attach an individual staff Auth identity to the workspace.
- `coach_profiles` stores one private Coach profile per Auth user.
- `coach_sessions`, `coach_messages`, `coach_assessments` and `coach_learning_profiles` are scoped to the individual Auth user.
- A shop owner can read workspace membership records but cannot read another member's private profile, transcripts, feedback or learning state.
- Transcript text is stored; microphone recordings/audio blobs are not.

Authorization uses `auth.uid()`, explicit grants and RLS. It does not trust user-editable `user_metadata` claims. The two workspace authorization helpers live in the non-exposed `private` schema with a fixed empty `search_path`.

## Why the schema is not deployed yet

The connected Supabase account currently has only one organisation and two active free projects. The inactive project is not a safe test target without confirming its recovery and billing status, and the previous third-project attempt was refused by the free-project limit. No paid branch or project has been created.

Do not set `VITE_COACH_CLOUD_ENABLED=true` until:
1. An isolated development Supabase project is available.
2. The SQL has been generated as a timestamped migration using `supabase migration new coach_identity_phase2`.
3. The migration has been applied to that development project, and SQL/RLS tests and advisors pass.
4. The Coach tables are explicitly exposed through the project's Data API configuration if the browser client will access them. Do not expose the `private` schema.
5. Two separate Auth identities have been tested: each can read only their own Coach profile and learning history, while both can read permitted shared shop context.

Supabase changed public-schema Data API exposure defaults in 2026. A SQL `GRANT` alone is not proof that a table is exposed by the Data API. See:
- https://supabase.com/changelog/breaking-change-tables-not-exposed-to-data-api-automatically
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Remaining Phase 2 work

- Provision a genuinely isolated backend without touching production.
- Generate the timestamped migration via the Supabase CLI and apply it to that isolated backend.
- Run database-level positive and negative RLS tests with two real Auth identities.
- Verify workspace invitation/acceptance and membership suspension end-to-end before inviting employees.
- Verify cross-device read/write, concurrent writes, account switching and recovery.
- Only then enable Coach cloud persistence in the development preview.

The repository functions are intentionally not wired into Learn screens in this phase. UI integration will happen when the assessment and simulation phases are built.
