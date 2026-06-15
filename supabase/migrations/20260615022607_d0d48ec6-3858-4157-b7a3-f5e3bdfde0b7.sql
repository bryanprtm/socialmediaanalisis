DROP POLICY IF EXISTS "Authenticated insert keyword queries" ON public.keyword_queries;
DROP POLICY IF EXISTS "Authenticated update keyword queries" ON public.keyword_queries;
DROP POLICY IF EXISTS "Authenticated delete keyword queries" ON public.keyword_queries;
CREATE POLICY "Admins insert keyword queries" ON public.keyword_queries FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update keyword queries" ON public.keyword_queries FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete keyword queries" ON public.keyword_queries FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));