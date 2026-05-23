import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { ResponsiveContainer, BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { TrendingUp, Hash, Flame, Activity, Sparkles } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trends & Topics — PROPAM Command Center" },
      { name: "description", content: "Analisis trending topics dari news database." },
    ],
  }),
  component: TrendsPage,
});

function TrendsPage() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);
  const trending = s.keywords.slice(0, 10);
  const topCats = s.categories.slice(0, 8);
  const maxKw = trending[0]?.count ?? 1;

  // 7-day evolution by top 4 categories
  const top4 = topCats.slice(0, 4).map((c) => c.name);
  const days = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - (6 - i));
    const dayEnd = dayStart.getTime() + 86400000;
    const row: Record<string, number | string> = { t: dayStart.toLocaleDateString("id-ID", { weekday: "short" }) };
    for (const cat of top4) row[cat] = 0;
    for (const a of filtered) {
      if (!a.published_at || !a.category || !top4.includes(a.category)) continue;
      const t = new Date(a.published_at).getTime();
      if (t >= dayStart.getTime() && t < dayEnd) row[a.category] = (row[a.category] as number) + 1;
    }
    return row;
  });

  const palette = ["oklch(0.78 0.18 195)", "oklch(0.65 0.22 295)", "oklch(0.78 0.2 150)", "oklch(0.82 0.18 80)"];

  return (
    <PageShell
      eyebrow="Real-time Pulse"
      title="Trends & Topics"
      description="Trending topik dan distribusi kategori dihitung langsung dari news database."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Artikel" value={String(s.total)} icon={<Activity className="h-5 w-5" />} accent="cyan" hint={active ? "Filtered" : "All"} />
        <MetricCard label="Keyword Unik" value={String(s.keywords.length)} icon={<Hash className="h-5 w-5" />} accent="violet" />
        <MetricCard label="Kategori Aktif" value={String(s.categories.length)} icon={<Sparkles className="h-5 w-5" />} accent="success" />
        <MetricCard label="Sumber" value={String(s.sources.length)} icon={<TrendingUp className="h-5 w-5" />} accent="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Topik Trending" icon={<Flame className="h-4 w-4" />}>
          {loading ? <p className="py-6 text-center text-xs text-muted-foreground">Memuat…</p> : trending.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{active ? "Tidak ada keyword cocok dengan filter aktif." : "Belum ada keyword terindeks."}</p>
          ) : (
            <ul className="space-y-2">
              {trending.map((k, i) => (
                <li key={k.name} className="rounded-lg border border-border bg-panel-elevated p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-primary">#{i + 1}</p>
                      <p className="truncate text-sm font-semibold text-foreground">{k.name}</p>
                    </div>
                    <Pill tone="info">{k.count}</Pill>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-cyan" style={{ width: `${Math.round((k.count / maxKw) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-2" title="Evolusi Kategori (7 Hari)" icon={<Activity className="h-4 w-4" />}>
          {top4.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Belum ada artikel dengan kategori.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="t" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                  <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                  {top4.map((c, i) => (
                    <RBar key={c} dataKey={c} stackId="a" fill={palette[i % palette.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="mt-6" title="Distribusi Kategori" icon={<Hash className="h-4 w-4" />}>
        {topCats.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Belum ada kategori.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topCats.map((c) => (
              <div key={c.name} className="rounded-lg border border-border bg-panel-elevated p-4">
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{c.count} artikel</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-cyan" style={{ width: `${Math.round((c.count / (topCats[0]?.count || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
