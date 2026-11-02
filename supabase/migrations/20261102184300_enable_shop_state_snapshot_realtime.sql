-- Enable owner-scoped Realtime notifications for cross-device shop snapshot sync.
-- RLS on shop_state_snapshots remains the authorization boundary.

ALTER PUBLICATION supabase_realtime
  ADD TABLE public.shop_state_snapshots;

-- Use the database clock for snapshot ordering, not device clocks.
CREATE OR REPLACE FUNCTION public.set_shop_state_snapshot_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_shop_state_snapshot_updated_at
  ON public.shop_state_snapshots;

CREATE TRIGGER set_shop_state_snapshot_updated_at
BEFORE UPDATE ON public.shop_state_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.set_shop_state_snapshot_updated_at();

REVOKE ALL ON FUNCTION public.set_shop_state_snapshot_updated_at()
  FROM PUBLIC, anon, authenticated;
