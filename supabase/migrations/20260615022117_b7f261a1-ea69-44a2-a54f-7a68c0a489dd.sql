DROP POLICY IF EXISTS "Admins insert keyword queries" ON public.keyword_queries;
DROP POLICY IF EXISTS "Admins update keyword queries" ON public.keyword_queries;
DROP POLICY IF EXISTS "Admins delete keyword queries" ON public.keyword_queries;
CREATE POLICY "Authenticated insert keyword queries" ON public.keyword_queries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update keyword queries" ON public.keyword_queries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete keyword queries" ON public.keyword_queries FOR DELETE TO authenticated USING (true);