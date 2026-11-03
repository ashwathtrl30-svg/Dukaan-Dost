-- Allow the current version-2 snapshot payload while retaining version-1 compatibility.
-- Keep schema_version defaulting to 1 for legacy clients that omit the column.
-- The application explicitly writes version 2; readers already support versions 1 and 2.

ALTER TABLE public.shop_state_snapshots
  DROP CONSTRAINT shop_state_snapshots_schema_version_check,
  ADD CONSTRAINT shop_state_snapshots_schema_version_check
    CHECK (schema_version IN (1, 2));
