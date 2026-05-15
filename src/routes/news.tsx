import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { Database, FileText, Globe, RefreshCw, ExternalLink, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News Database — PROPAM" },
      { name: "description", content: "Database seluruh berita yang dipantau secara real-time." },
    ],
  }),
  component: Page,
});

type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string | null;
  excerpt: string | null;
  sentiment: "positive" | "negative" | "neutral" | null;
  sentiment_score: number | null;
  confidence: number | null;
  published_at: string | null;
  region: string | null;
  keywords: string[] | null;
};

const empty = {
  title: "",
  url: "",
  source: "",
  category: "",
  excerpt: "",
};

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

function Page() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    let q = supabase
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("sentiment", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setArticles((data ?? []) as Article[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("news-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "news_articles" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function addArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.url || !form.source) {
      toast.error("Title, URL, dan Source wajib diisi");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("news_articles").insert({
      title: form.title,
      url: form.url,
      source: form.source,
      category: form.category || null,
      excerpt: form.excerpt || null,
      published_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Berita ditambahkan");
    setForm(empty);
  }

  const counts = {
    total: articles.length,
    positive: articles.filter((a) => a.sentiment === "positive").length,
    negative: articles.filter((a) => a.sentiment === "negative").length,
    sources: new Set(articles.map((a) => a.source)).size,
  };

  return (
    <PageShell
      eyebrow="Database"
      title="News Database"
      description="Penyimpanan terpusat seluruh berita yang dipantau — real-time, dapat dicari, terhubung ke pipeline AI."
      actions={
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Berita" value={String(counts.total)} icon={<Database className="h-5 w-5" />} accent="cyan" hint="Tersimpan di DB" />
        <MetricCard label="Sentiment Positif" value={String(counts.positive)} icon={<FileText className="h-5 w-5" />} accent="success" />
        <MetricCard label="Sentiment Negatif" value={String(counts.negative)} icon={<AlertCircle className="h-5 w-5" />} accent="amber" />
        <MetricCard label="Sumber Unik" value={String(counts.sources)} icon={<Globe className="h-5 w-5" />} accent="violet" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Stream Berita"
          icon={<FileText className="h-4 w-4" />}
          action={
            <div className="flex gap-1.5">
              {(["all", "positive", "negative", "neutral"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition ${
                    filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Memuat data…</div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada berita di database</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {articles.map((a) => (
                <li key={a.id} className="group py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">{a.title}</h3>
                    {a.sentiment && (
                      <Pill tone={a.sentiment === "positive" ? "positive" : a.sentiment === "negative" ? "negative" : "neutral"}>
                        {a.sentiment} {a.sentiment_score ? `· ${a.sentiment_score.toFixed(2)}` : ""}
                      </Pill>
                    )}
                  </div>
                  {a.excerpt && <p className="mt-1.5 text-sm text-muted-foreground">{a.excerpt}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <span className="text-primary">{a.source}</span>
                    {a.category && <Pill tone="info">{a.category}</Pill>}
                    {a.region && <span>· 📍 {a.region}</span>}
                    <span>· ⏱ {timeAgo(a.published_at)}</span>
                    <a href={a.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-primary hover:underline">
                      Source <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {a.keywords && a.keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {a.keywords.map((k) => (
                        <span key={k} className="rounded-full border border-border bg-panel-elevated px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                          #{k}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Tambah Berita Manual" icon={<Plus className="h-4 w-4" />}>
          <form onSubmit={addArticle} className="space-y-2.5">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul berita *" className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none" />
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} type="url" placeholder="URL *" className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source *" className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none" />
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Kategori" className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none" />
            </div>
            <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Ringkasan / excerpt" rows={3} className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none" />
            <button disabled={submitting} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-cyan text-xs font-semibold text-background disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" /> {submitting ? "Menyimpan…" : "Simpan ke Database"}
            </button>
            <p className="font-mono text-[10px] text-muted-foreground">
              * Wajib login. Berita publik dapat dilihat semua orang, namun hanya pengguna terautentikasi yang dapat menambah.
            </p>
          </form>
        </Panel>
      </div>
    </PageShell>
  );
}
