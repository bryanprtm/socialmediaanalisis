
CREATE TABLE public.keyword_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  expression text NOT NULL,
  terms text[] NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.keyword_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view keyword queries" ON public.keyword_queries FOR SELECT USING (true);
CREATE POLICY "Auth insert keyword queries" ON public.keyword_queries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update keyword queries" ON public.keyword_queries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete keyword queries" ON public.keyword_queries FOR DELETE TO authenticated USING (true);

CREATE TRIGGER set_updated_at_keyword_queries
BEFORE UPDATE ON public.keyword_queries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
