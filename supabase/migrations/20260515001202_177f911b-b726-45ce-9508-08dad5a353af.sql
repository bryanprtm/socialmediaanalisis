
-- Enum untuk sentiment
CREATE TYPE public.sentiment_type AS ENUM ('positive', 'negative', 'neutral');
CREATE TYPE public.feed_status AS ENUM ('active', 'warning', 'error', 'paused');

-- Tabel sumber RSS
CREATE TABLE public.rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT,
  status public.feed_status NOT NULL DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  health_score INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel berita
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  category TEXT,
  content TEXT,
  excerpt TEXT,
  author TEXT,
  image_url TEXT,
  language TEXT DEFAULT 'id',
  region TEXT,
  keywords TEXT[] DEFAULT '{}',
  sentiment public.sentiment_type,
  sentiment_score NUMERIC(4,3),
  confidence NUMERIC(4,3),
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_source ON public.news_articles(source);
CREATE INDEX idx_news_category ON public.news_articles(category);
CREATE INDEX idx_news_sentiment ON public.news_articles(sentiment);
CREATE INDEX idx_news_keywords ON public.news_articles USING GIN(keywords);

-- Tabel keyword tracking
CREATE TABLE public.tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  alert_enabled BOOLEAN NOT NULL DEFAULT false,
  mention_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_feeds_updated BEFORE UPDATE ON public.rss_feeds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_keywords ENABLE ROW LEVEL SECURITY;

-- Public read (monitoring data)
CREATE POLICY "Anyone can view news" ON public.news_articles FOR SELECT USING (true);
CREATE POLICY "Anyone can view feeds" ON public.rss_feeds FOR SELECT USING (true);
CREATE POLICY "Anyone can view keywords" ON public.tracked_keywords FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY "Auth insert news" ON public.news_articles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update news" ON public.news_articles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete news" ON public.news_articles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert feeds" ON public.rss_feeds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update feeds" ON public.rss_feeds FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete feeds" ON public.rss_feeds FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert keywords" ON public.tracked_keywords FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update keywords" ON public.tracked_keywords FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete keywords" ON public.tracked_keywords FOR DELETE TO authenticated USING (true);
