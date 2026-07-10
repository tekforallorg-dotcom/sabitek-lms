-- ============================================================
-- Close client-side certificate self-issuance.
--
-- Certificate issuance now goes through /api/certificates/issue
-- (service role, verifies completion server-side), so browsers no
-- longer need INSERT on certificates. Dropping the insert-own
-- policy makes self-minting impossible for any client role.
--
-- ⚠ Apply ONLY AFTER the app deploy containing the issuance API
--   route is live, otherwise the old client insert breaks.
-- ============================================================

DROP POLICY IF EXISTS "Users can insert own certificates" ON public.certificates;

REVOKE INSERT ON public.certificates FROM authenticated;
