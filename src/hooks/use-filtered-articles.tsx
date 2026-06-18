import { useEffect, useState } from "react";
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

function articleText(a: Article) {
  return [
    a.title,
    a.excerpt ?? "",
    a.content ?? "",
    a.source,
    a.category ?? "",
    a.region ?? "",
    (a.keywords ?? []).join(" "),
  ].join(" ");
}

export function useFilteredArticles() {
  const { active } = useActiveKeyword();
  const { startDate, endDate } = useDateFilter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
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
        if (data.length < pageSize) break;
      }
      if (mounted) {
        setArticles(all);
        setLoading(false);
      }
    }
    load();
    const ch = supabase
      .channel("articles-filtered")
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

  const filtered = active
    ? articles.filter((a) => evalExpression(active.expression, articleText(a)))
    : articles;

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
