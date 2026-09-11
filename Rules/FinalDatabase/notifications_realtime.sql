-- Live inbox for the mobile app. Safe to run more than once.

-- 1. Stream changes on this table to subscribed clients.
--    Guarded: a plain ALTER PUBLICATION errors with 42710 if the table is
--    already a member, and that error aborts everything after it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 2. Required for DELETE events.
--    By default Postgres only ships the primary key on a delete, so the client's
--    filter (recipient_user_id=eq.<user>) can never match and deletions never
--    arrive. FULL includes the old row so the filter works.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 3. Check the read policy. Realtime enforces RLS, so each student must be able
--    to SELECT their own rows or no events are delivered at all.
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notifications';

--    Only if the query above lists no SELECT policy:
-- CREATE POLICY notifications_select_own ON public.notifications
--   FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());

-- 4. Confirm both settings landed.
--    relreplident should read 'f' (full).
SELECT
  (SELECT count(*) FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime'
     AND schemaname = 'public'
     AND tablename = 'notifications') AS in_publication,
  relreplident
FROM pg_class
WHERE oid = 'public.notifications'::regclass;
