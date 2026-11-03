-- Dukaan Dost Phase 5: make shop ownership a mandatory RLS condition
-- and apply least-privilege grants to exposed client roles.

-- The snapshot client only reads, inserts, and updates its one owner row.
-- It does not need to delete the entire cloud snapshot row; deleting the Auth
-- user still removes this row through the existing ON DELETE CASCADE foreign key.
REVOKE ALL PRIVILEGES ON TABLE public.shop_state_snapshots
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.shop_state_snapshots
  TO authenticated;

DROP POLICY IF EXISTS "shop owners can delete their own snapshot"
  ON public.shop_state_snapshots;

-- Keep the existing permissive owner policies for normal access, and add
-- restrictive guards so a future permissive policy cannot widen tenant access.
DROP POLICY IF EXISTS "snapshot owner boundary select"
  ON public.shop_state_snapshots;
CREATE POLICY "snapshot owner boundary select"
  ON public.shop_state_snapshots
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "snapshot owner boundary insert"
  ON public.shop_state_snapshots;
CREATE POLICY "snapshot owner boundary insert"
  ON public.shop_state_snapshots
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "snapshot owner boundary update"
  ON public.shop_state_snapshots;
CREATE POLICY "snapshot owner boundary update"
  ON public.shop_state_snapshots
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

-- The encrypted legacy vault remains available to its existing client flows,
-- but only through owner-scoped CRUD. It receives the same mandatory guards.
REVOKE ALL PRIVILEGES ON TABLE public.shop_vaults
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shop_vaults
  TO authenticated;

DROP POLICY IF EXISTS "vault owner boundary select"
  ON public.shop_vaults;
CREATE POLICY "vault owner boundary select"
  ON public.shop_vaults
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "vault owner boundary insert"
  ON public.shop_vaults;
CREATE POLICY "vault owner boundary insert"
  ON public.shop_vaults
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "vault owner boundary update"
  ON public.shop_vaults;
CREATE POLICY "vault owner boundary update"
  ON public.shop_vaults
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "vault owner boundary delete"
  ON public.shop_vaults;
CREATE POLICY "vault owner boundary delete"
  ON public.shop_vaults
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

-- Secure future objects created by the migration owner in the exposed public
-- schema. New client-facing objects must receive explicit, reviewed grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.shop_state_snapshots IS
  'Dukaan Dost owner-scoped cloud snapshot. Authenticated clients may select, insert and update only their own row; account deletion cascades.';

COMMENT ON TABLE public.shop_vaults IS
  'Dukaan Dost encrypted owner-scoped vault. Every authenticated operation is restricted to auth.uid() = user_id.';
