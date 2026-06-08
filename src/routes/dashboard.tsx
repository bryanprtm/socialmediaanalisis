import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Bar, Pill } from "@/components/PageShell";
import { ResponsiveContainer, BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Newspaper, Globe, MessageCircle, Bell, RefreshCw, ChevronRight, TrendingUp, BarChart3, Activity, ExternalLink } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";
import { KeywordIntelligence } from "@/components/KeywordIntelligence";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Analytics — PROPAM Command Center" },
      { name: "description", content: "Real-time monitoring dashboard dari news database." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);

  // Time-series: last 24h, bucketed per 4h
  const now = Date.now();
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const start = now - (6 - i) * 4 * 3600 * 1000;
    const end = start + 4 * 3600 * 1000;
    const inBucket = filtered.filter((a) => {
      if (!a.published_at) return false;
      const t = new Date(a.published_at).getTime();
      return t >= start && t < end;
    });
    const d = new Date(start);
    return {
      t: `${String(d.getHours()).padStart(2, "0")}:00`,
      positif: inBucket.filter((x) => x.sentiment === "positive").length,
      negatif: inBucket.filter((x) => x.sentiment === "negative").length,
      netral: inBucket.filter((x) => x.sentiment === "neutral").length,
    };
  });

  const recent = filtered.slice(0, 5);
  const topSources = s.sources.slice(0, 5);
  const topKeywords = s.keywords.slice(0, 5);
  const maxSource = topSources[0]?.count ?? 1;
  const maxKw = topKeywords[0]?.count ?? 1;

  return (
    <PageShell
      eyebrow="Realtime Telemetry"
      title="Dashboard Analytics"
      description="Real-time monitoring dari news database. Disaring berdasarkan kata kunci aktif."
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Auto Refresh
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Berita" value={String(s.total)} icon={<Newspaper className="h-5 w-5" />} accent="cyan" hint={active ? "Filtered" : "Semua artikel"} />
        <MetricCard label="Sumber Aktif" value={String(s.sources.length)} icon={<Globe className="h-5 w-5" />} accent="success" />
        <MetricCard label="Sentiment Positif" value={`${s.pctPos}%`} icon={<MessageCircle className="h-5 w-5" />} accent="violet" hint={`${s.pos} artikel`} />
        <MetricCard label="Sentiment Negatif" value={`${s.pctNeg}%`} icon={<Bell className="h-5 w-5" />} accent="amber" hint={`${s.neg} artikel`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Berita Terkini" icon={<Newspaper className="h-4 w-4" />}>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p>
          ) : recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{active ? "Tidak ada berita cocok dengan filter aktif." : "Belum ada berita di database."}</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((a, i) => (
                <li key={a.id} className="group rounded-xl border border-border bg-panel-elevated p-4 transition-colors hover:border-primary/30">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-sm font-semibold text-foreground">{a.title}</h3>
                        {a.sentiment && <Pill tone={a.sentiment === "positive" ? "positive" : a.sentiment === "negative" ? "negative" : "neutral"}>{a.sentiment}</Pill>}
                      </div>
                      {a.excerpt && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>}
                      <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                        <span className="text-primary">{a.source}</span>
                        {a.category && <Pill tone="info">{a.category}</Pill>}
                        <a href={a.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-primary hover:underline">
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/news" className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-primary hover:underline">
            Lihat Semua Berita <ChevronRight className="h-3 w-3" />
          </Link>
        </Panel>

        <div className="space-y-5">
          <Panel title="Top Sumber" icon={<Globe className="h-4 w-4" />}>
            {topSources.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Belum ada data</p>
            ) : (
              <ul className="space-y-3">
                {topSources.map((p) => (
                  <li key={p.name} className="rounded-lg border border-border bg-panel-elevated p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{p.name}</span>
                      <span className="font-mono text-xs font-bold text-primary">{p.count}</span>
                    </div>
                    <div className="mt-2">
                      <Bar label="Volume" value={Math.round((p.count / maxSource) * 100)} color="primary" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Quick Actions">
            <div className="space-y-2">
              <Link to="/news" className="flex w-full items-center gap-2 rounded-lg bg-gradient-cyan px-4 py-2.5 text-sm font-semibold text-background"><Newspaper className="h-4 w-4" /> Kelola Berita</Link>
              <Link to="/rss" className="flex w-full items-center gap-2 rounded-lg border border-border bg-panel-elevated px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"><Globe className="h-4 w-4" /> Kelola RSS</Link>
              <Link to="/keywords" className="flex w-full items-center gap-2 rounded-lg border border-border bg-panel-elevated px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"><BarChart3 className="h-4 w-4" /> Kata Kunci</Link>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Sentiment Timeline (24 Jam)" icon={<Activity className="h-4 w-4" />}>
          {s.total === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data untuk timeline.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="t" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                  <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                  <RBar dataKey="positif" stackId="a" fill="oklch(0.78 0.2 150)" />
                  <RBar dataKey="netral" stackId="a" fill="oklch(0.65 0.02 240)" />
                  <RBar dataKey="negatif" stackId="a" fill="oklch(0.65 0.24 22)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Trending Keywords" icon={<TrendingUp className="h-4 w-4" />}>
          {topKeywords.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Belum ada keyword terindeks di artikel.</p>
          ) : (
            <ul className="space-y-3">
              {topKeywords.map((k) => (
                <li key={k.name} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">#{k.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{k.count} mentions</p>
                  </div>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-cyan" style={{ width: `${Math.round((k.count / maxKw) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
