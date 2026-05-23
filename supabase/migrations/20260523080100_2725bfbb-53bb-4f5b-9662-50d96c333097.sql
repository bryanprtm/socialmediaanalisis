
-- Roles enum & table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix mutable function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Replace permissive write policies with admin-only on all app tables
-- news_articles
DROP POLICY IF EXISTS "Auth delete news" ON public.news_articles;
DROP POLICY IF EXISTS "Auth insert news" ON public.news_articles;
DROP POLICY IF EXISTS "Auth update news" ON public.news_articles;
CREATE POLICY "Admins insert news" ON public.news_articles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update news" ON public.news_articles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete news" ON public.news_articles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- rss_feeds
DROP POLICY IF EXISTS "Auth delete feeds" ON public.rss_feeds;
DROP POLICY IF EXISTS "Auth insert feeds" ON public.rss_feeds;
DROP POLICY IF EXISTS "Auth update feeds" ON public.rss_feeds;
CREATE POLICY "Admins insert feeds" ON public.rss_feeds FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update feeds" ON public.rss_feeds FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete feeds" ON public.rss_feeds FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- tracked_keywords
DROP POLICY IF EXISTS "Auth delete keywords" ON public.tracked_keywords;
DROP POLICY IF EXISTS "Auth insert keywords" ON public.tracked_keywords;
DROP POLICY IF EXISTS "Auth update keywords" ON public.tracked_keywords;
CREATE POLICY "Admins insert keywords" ON public.tracked_keywords FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update keywords" ON public.tracked_keywords FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete keywords" ON public.tracked_keywords FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- keyword_queries
DROP POLICY IF EXISTS "Auth delete keyword queries" ON public.keyword_queries;
DROP POLICY IF EXISTS "Auth insert keyword queries" ON public.keyword_queries;
DROP POLICY IF EXISTS "Auth update keyword queries" ON public.keyword_queries;
CREATE POLICY "Admins insert keyword queries" ON public.keyword_queries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update keyword queries" ON public.keyword_queries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete keyword queries" ON public.keyword_queries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed admin role for the existing admin@admin.com user (if exists)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'admin@admin.com'
ON CONFLICT (user_id, role) DO NOTHING;
