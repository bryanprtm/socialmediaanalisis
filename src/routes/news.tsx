import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { Database, FileText, Globe, RefreshCw, ExternalLink, Plus, AlertCircle, Pencil, Trash2, Save, X, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useActiveKeyword } from "@/hooks/use-active-keyword";
import { useDateFilter, matchesDateFilter } from "@/hooks/use-date-filter";
import { evalExpression } from "@/lib/keyword-query";
import { toast } from "sonner";
import { syncAllRssFeeds } from "@/lib/rss-sync.functions";
import { analyzeMissingSentiment } from "@/lib/sentiment-analysis.functions";
import { AINarrative } from "@/components/AINarrative";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News Database — TOC Sat Bantek" },
      { name: "description", content: "Database seluruh berita yang dipantau secara real-time." },
    ],
  }),
  component: Page,
});

type Sentiment = "positive" | "negative" | "neutral";
type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string | null;
  excerpt: string | null;
  sentiment: Sentiment | null;
  sentiment_score: number | null;
  confidence: number | null;
  published_at: string | null;
  region: string | null;
  keywords: string[] | null;
};

const empty = { title: "", url: "", source: "", category: "", excerpt: "" };

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

const LIST_COLUMNS =
  "id,title,url,source,category,excerpt,sentiment,sentiment_score,confidence,published_at,region,keywords";

function Page() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { active } = useActiveKeyword();
  const { startDate, endDate } = useDateFilter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Sentiment>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [totalCount, setTotalCount] = useState(0);
  const [posCount, setPosCount] = useState(0);
  const [negCount, setNegCount] = useState(0);
  const [pendingNew, setPendingNew] = useState(0);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Article>>({});
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const isAdmin = !!user?.id && adminUserId === user.id;
  const syncAllFn = useServerFn(syncAllRssFeeds);
  const analyzeFn = useServerFn(analyzeMissingSentiment);

  useEffect(() => {
    let cancelled = false;
    setAdminUserId(null);
    if (!user?.id) {
      setRoleLoading(false);
      return () => {
        cancelled = true;
      };
    }
    setRoleLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setAdminUserId(!error && data ? user.id : null);
        setRoleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);


  async function syncAll(silent = false) {
    if (!isAdmin) {
      if (!silent) toast.error("Akses admin diperlukan untuk sync RSS");
      return;
    }
    try {
      const r = await syncAllFn();
      if (!silent) toast.success(`Sync selesai: +${r.totalAdded} berita baru dari ${r.feedCount} feed${r.errors ? ` (${r.errors} error)` : ""}`);
    } catch (e: any) {
      if (!silent) toast.error(e?.message ?? "Sync gagal");
    }
  }

  async function analyzeSentiment(silent = false) {
    if (!isAdmin) {
      if (!silent) toast.error("Akses admin diperlukan untuk analisa sentiment");
      return;
    }
    try {
      const r = await analyzeFn({ data: { limit: 200 } });
      if (!silent) toast.success(`Analisa selesai: ${r.updated}/${r.processed} berita terklasifikasi · ${r.remaining} sisa belum dianalisa`);
      await load();
    } catch (e: any) {
      if (!silent) toast.error(e?.message ?? "Analisa gagal");
    }
  }

  // Build a query with the shared filters (date range, active keyword terms).
  function applyFilters<T extends { gte: any; lte: any; overlaps: any; eq: any }>(q: T): T {
    let out: any = q;
    if (startDate) out = out.gte("published_at", `${startDate}T00:00:00`);
    if (endDate) out = out.lte("published_at", `${endDate}T23:59:59.999`);
    if (active && active.terms && active.terms.length > 0) {
      out = out.overlaps("keywords", active.terms);
    }
    return out as T;
  }

  async function load() {
    setLoading(true);
    setPendingNew(0);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Main paginated list (only the current page, without `content`).
    let listQ: any = supabase
      .from("news_articles")
      .select(LIST_COLUMNS, { count: "exact" })
      .order("published_at", { ascending: false })
      .range(from, to);
    if (filter !== "all") listQ = listQ.eq("sentiment", filter);
    listQ = applyFilters(listQ);

    // Sentiment counts (head:true → no rows transferred).
    let totalQ: any = supabase.from("news_articles").select("id", { count: "exact", head: true });
    let posQ: any = supabase.from("news_articles").select("id", { count: "exact", head: true }).eq("sentiment", "positive");
    let negQ: any = supabase.from("news_articles").select("id", { count: "exact", head: true }).eq("sentiment", "negative");
    totalQ = applyFilters(totalQ);
    posQ = applyFilters(posQ);
    negQ = applyFilters(negQ);

    const [listRes, totalRes, posRes, negRes] = await Promise.all([listQ, totalQ, posQ, negQ]);

    if (listRes.error) {
      toast.error(listRes.error.message);
    } else {
      setArticles((listRes.data ?? []) as Article[]);
      setTotalCount(listRes.count ?? 0);
    }
    if (!totalRes.error) setTotalCount(totalRes.count ?? 0);
    if (!posRes.error) setPosCount(posRes.count ?? 0);
    if (!negRes.error) setNegCount(negRes.count ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("news-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "news_articles" }, () => {
        setPendingNew((n) => n + 1);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, active?.id, startDate, endDate]);

  // Auto sync RSS + analyze sentiment every 1 minute (admin only)
  useEffect(() => {
    if (authLoading || roleLoading || !isAuthenticated || !isAdmin) return;
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await syncAll(true);
      if (cancelled) return;
      await analyzeSentiment(true);
    };
    run();
    const id = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, roleLoading, isAuthenticated, isAdmin]);


  async function addArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.url || !form.source) return toast.error("Title, URL, Source wajib");
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
    if (error) return toast.error(error.message);
    toast.success("Berita ditambahkan");
    setForm(empty);
    load();
  }

  function startEdit(a: Article) {
    setEditingId(a.id);
    setEditDraft({
      title: a.title,
      url: a.url,
      source: a.source,
      category: a.category,
      excerpt: a.excerpt,
      sentiment: a.sentiment,
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    const { error } = await supabase
      .from("news_articles")
      .update({
        title: editDraft.title,
        url: editDraft.url,
        source: editDraft.source,
        category: editDraft.category || null,
        excerpt: editDraft.excerpt || null,
        sentiment: editDraft.sentiment || null,
      })
      .eq("id", editingId);
    if (error) return toast.error(error.message);
    toast.success("Berita diperbarui");
    setEditingId(null);
    setEditDraft({});
    load();
  }

  async function deleteArticle(id: string) {
    if (!confirm("Hapus berita ini?")) return;
    const { error } = await supabase.from("news_articles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Berita dihapus");
    load();
  }

  // Server has already filtered/paginated; show rows as-is.
  const pageItems = articles;
  const filteredTotal = totalCount;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [filter, active?.id, startDate, endDate]);

  const counts = {
    total: filteredTotal,
    positive: posCount,
    negative: negCount,
    sources: new Set(pageItems.map((a) => a.source)).size,
  };

  return (
    <PageShell
      eyebrow="Database"
      title="News Database"
      description="Penyimpanan terpusat seluruh berita yang dipantau — real-time, dapat dicari, terhubung ke pipeline AI."
      actions={
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="hidden items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground md:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Auto-sync · 1m
            </span>
          )}
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      }
    >
      {!isAuthenticated && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-foreground">Login untuk menambah, mengedit, atau menghapus berita.</p>
          </div>
          <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-3 py-1.5 text-xs font-semibold text-background">
            <LogIn className="h-3.5 w-3.5" /> Login
          </Link>
        </div>
      )}

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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {active ? `Tidak ada berita cocok dengan query "${active.name}"` : "Belum ada berita di database"}
              </p>
            </div>
          ) : (
            <>
            <div className="max-h-[500px] overflow-y-auto pr-2">
              <ul className="divide-y divide-border">
              {pageItems.map((a) => {
                const isEditing = editingId === a.id;
                if (isEditing) {
                  return (
                    <li key={a.id} className="space-y-2 py-4">
                      <input
                        value={editDraft.title ?? ""}
                        onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                        placeholder="Judul"
                        className="h-9 w-full rounded-lg border border-primary/40 bg-panel-elevated px-3 text-sm text-foreground focus:outline-none"
                      />
                      <input
                        value={editDraft.url ?? ""}
                        onChange={(e) => setEditDraft({ ...editDraft, url: e.target.value })}
                        placeholder="URL"
                        className="h-9 w-full rounded-lg border border-border bg-panel-elevated px-3 text-xs font-mono text-foreground focus:outline-none"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          value={editDraft.source ?? ""}
                          onChange={(e) => setEditDraft({ ...editDraft, source: e.target.value })}
                          placeholder="Source"
                          className="h-9 rounded-lg border border-border bg-panel-elevated px-3 text-xs text-foreground focus:outline-none"
                        />
                        <input
                          value={editDraft.category ?? ""}
                          onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                          placeholder="Kategori"
                          className="h-9 rounded-lg border border-border bg-panel-elevated px-3 text-xs text-foreground focus:outline-none"
                        />
                        <select
                          value={editDraft.sentiment ?? ""}
                          onChange={(e) => setEditDraft({ ...editDraft, sentiment: (e.target.value || null) as Sentiment | null })}
                          className="h-9 rounded-lg border border-border bg-panel-elevated px-3 text-xs text-foreground focus:outline-none"
                        >
                          <option value="">— Sentiment —</option>
                          <option value="positive">Positive</option>
                          <option value="negative">Negative</option>
                          <option value="neutral">Neutral</option>
                        </select>
                      </div>
                      <textarea
                        value={editDraft.excerpt ?? ""}
                        onChange={(e) => setEditDraft({ ...editDraft, excerpt: e.target.value })}
                        rows={2}
                        placeholder="Excerpt"
                        className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingId(null); setEditDraft({}); }} className="inline-flex items-center gap-1 rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" /> Batal
                        </button>
                        <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded-md bg-gradient-cyan px-3 py-1.5 text-xs font-semibold text-background">
                          <Save className="h-3.5 w-3.5" /> Simpan
                        </button>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={a.id} className="group py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">{a.title}</h3>
                      <div className="flex items-center gap-2">
                        {a.sentiment && (
                          <Pill tone={a.sentiment === "positive" ? "positive" : a.sentiment === "negative" ? "negative" : "neutral"}>
                            {a.sentiment} {a.sentiment_score ? `· ${a.sentiment_score.toFixed(2)}` : ""}
                          </Pill>
                        )}
                        {isAuthenticated && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(a)}
                              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-primary/15 hover:text-primary"
                              aria-label="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteArticle(a.id)}
                              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                              aria-label="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
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
                );
              })}
            </ul>
            </div>
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="rounded-md border border-border bg-panel px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                  >
                    ← Sebelumnya
                  </button>
                  <span className="font-mono text-[10px] text-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="rounded-md border border-border bg-panel px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </Panel>

        <Panel title="Tambah Berita Manual" icon={<Plus className="h-4 w-4" />}>
          {!isAuthenticated ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <LogIn className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Login untuk menambah berita ke database.</p>
              <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-4 py-2 text-xs font-semibold text-background">
                <LogIn className="h-3.5 w-3.5" /> Login Sekarang
              </Link>
            </div>
          ) : (
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
            </form>
          )}
        </Panel>
      </div>

      <AINarrative
        className="mt-6"
        page="News Database"
        context={{
          total: counts.total,
          positif: counts.positive,
          negatif: counts.negative,
          jumlah_sumber: counts.sources,
          filter_sentimen: filter,
          query_aktif: active?.name ?? null,
          judul_terbaru: filtered.slice(0, 10).map((a) => ({ judul: a.title, sumber: a.source, sentimen: a.sentiment, kategori: a.category })),
        }}
      />
    </PageShell>
  );
}
