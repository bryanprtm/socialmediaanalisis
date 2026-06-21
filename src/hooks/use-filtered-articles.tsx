import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveKeyword } from "@/hooks/use-active-keyword";
import { useDateFilter, matchesDateFilter } from "@/hooks/use-date-filter";
import { evalExpression } from "@/lib/keyword-query";

export type Sentiment = "positive" | "negative" | "neutral";
export type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string | null;
  excerpt: string | null;
  content: string | null;
  sentiment: Sentiment | null;
  sentiment_score: number | null;
  confidence: number | null;
  published_at: string | null;
  region: string | null;
  keywords: string[] | null;
};

// Indonesian + English stopwords (ringkas) — disaring saat ekstraksi keyword
const STOPWORDS = new Set<string>([
  "yang","untuk","dengan","dari","pada","akan","tidak","adalah","ini","itu","dan","atau","juga","sudah","saat","oleh","dalam","sebagai","karena","agar","bisa","masih","telah","para","saya","kami","mereka","anda","kita","ada","tak","tapi","bagi","kepada","tentang","setelah","sebelum","jadi","lagi","saja","pun","kah","lah","nya","dia","beliau","kalau","jika","maka","supaya","hanya","sangat","lebih","paling","semua","seluruh","setiap","masing","punya","milik","apa","siapa","kenapa","mengapa","bagaimana","dimana","kapan","ke","di","ya","yg","krn","dgn","utk","new","the","and","for","with","from","that","this","you","are","was","were","not","but","has","have","had","will","would","can","could","should","into","over","under","about","after","before","when","what","who","how","why","where",
  "berita","news","update","terbaru","viral","resmi","kata","ucap","jelas","sebut","bilang","tegas","ungkap","sampai","mulai","tetap","bukan","atas","bawah","laki","perempuan","pria","wanita","orang","hari","tahun","bulan","kali","kasus","aksi","jadi","jam","wib","wita","tahun"
]);

function tokenize(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s\u00C0-\u017F]/g, " ").split(/\s+/);
  return words.filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

/** Ekstrak keyword: prioritas kolom keywords, fallback ke judul. */
function extractKeywords(a: Article): string[] {
  const base = (a.keywords ?? []).filter((k) => typeof k === "string" && k.trim().length > 0);
  if (base.length > 0) return base.map((k) => k.toLowerCase().trim());
  // Fallback: ekstrak dari judul (top kata signifikan)
  const tokens = tokenize(a.title ?? "");
  // Dedup, kembalikan max 6 token signifikan
  return Array.from(new Set(tokens)).slice(0, 6);
}

function articleText(a: Article) {
  return [
    a.title,
    a.excerpt ?? "",
    a.content ?? "",
    a.source,
    a.category ?? "",
    a.region ?? "",
    extractKeywords(a).join(" "),
  ].join(" ");
}

type ArticlesCtx = {
  articles: Article[];
  loading: boolean;
};

const ArticlesContext = createContext<ArticlesCtx | null>(null);

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const pageSize = 1000;
      const all: Article[] = [];
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from("news_articles")
          .select("*")
          .order("published_at", { ascending: false })
          .range(from, from + pageSize - 1);
        if (error || !data || data.length === 0) break;
        all.push(...(data as Article[]));
        if (!mounted) return;
        // Progressive update: show first batch immediately
        if (from === 0) {
          setArticles(all.slice());
          setLoading(false);
        }
        if (data.length < pageSize) break;
      }
      if (mounted) {
        setArticles(all);
        setLoading(false);
      }
    }
    load();
    const ch = supabase
      .channel("articles-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news_articles" },
        () => load(),
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const value = useMemo(() => ({ articles, loading }), [articles, loading]);
  return <ArticlesContext.Provider value={value}>{children}</ArticlesContext.Provider>;
}

export function useFilteredArticles() {
  const ctx = useContext(ArticlesContext);
  const { active } = useActiveKeyword();
  const { startDate, endDate } = useDateFilter();
  const articles = ctx?.articles ?? [];
  const loading = ctx?.loading ?? true;

  const filtered = useMemo(
    () =>
      articles
        .filter((a) => matchesDateFilter(a.published_at, startDate, endDate))
        .filter((a) => (active ? evalExpression(active.expression, articleText(a)) : true)),
    [articles, active, startDate, endDate],
  );

  return { articles, filtered, loading, active };
}

export function summarize(filtered: Article[]) {
  const total = filtered.length;
  const pos = filtered.filter((a) => a.sentiment === "positive").length;
  const neg = filtered.filter((a) => a.sentiment === "negative").length;
  const neu = filtered.filter((a) => a.sentiment === "neutral").length;
  const sourceMap = new Map<string, number>();
  const catMap = new Map<string, number>();
  const kwMap = new Map<string, number>();
  const regionMap = new Map<string, number>();
  for (const a of filtered) {
    sourceMap.set(a.source, (sourceMap.get(a.source) ?? 0) + 1);
    if (a.category) catMap.set(a.category, (catMap.get(a.category) ?? 0) + 1);
    if (a.region) regionMap.set(a.region, (regionMap.get(a.region) ?? 0) + 1);
    for (const k of a.keywords ?? []) kwMap.set(k, (kwMap.get(k) ?? 0) + 1);
  }
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
  return {
    total,
    pos,
    neg,
    neu,
    pctPos: pct(pos),
    pctNeg: pct(neg),
    pctNeu: pct(neu),
    sources: [...sourceMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    categories: [...catMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    keywords: [...kwMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    regions: [...regionMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}
