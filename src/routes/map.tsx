import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill, Bar } from "@/components/PageShell";
import { Map as MapIcon, MapPin, TrendingUp, Activity } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Peta Indonesia — PROPAM" },
      { name: "description", content: "Distribusi berita per region dari news database." },
    ],
  }),
  component: Page,
});

function Page() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);
  const max = s.regions[0]?.count ?? 1;

  return (
    <PageShell
      eyebrow="Geographic Intelligence"
      title="Peta Indonesia"
      description="Distribusi berita per region — dihitung langsung dari news database. Tersaring berdasarkan kata kunci aktif."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Region Terpantau" value={String(s.regions.length)} icon={<MapPin className="h-5 w-5" />} accent="cyan" hint={active ? "Filtered" : "All"} />
        <MetricCard label="Total Artikel" value={String(s.total)} icon={<Activity className="h-5 w-5" />} accent="success" />
        <MetricCard label="Hotspot" value={s.regions[0]?.name ?? "—"} icon={<TrendingUp className="h-5 w-5" />} accent="amber" hint={`${s.regions[0]?.count ?? 0} mentions`} />
        <MetricCard label="Sentiment Positif" value={`${s.pctPos}%`} icon={<Activity className="h-5 w-5" />} accent="violet" />
      </div>

      <Panel className="mt-6" title="Distribusi Region" icon={<MapIcon className="h-4 w-4" />}>
        {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p> : s.regions.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Belum ada artikel dengan label region. Tambahkan kolom region pada berita di News Database.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.regions.map((r, i) => {
              const items = filtered.filter((a) => a.region === r.name);
              const pos = items.filter((a) => a.sentiment === "positive").length;
              const sentPct = items.length ? Math.round((pos / items.length) * 100) : 0;
              return (
                <li key={r.name} className="rounded-lg border border-border bg-panel-elevated p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-sm font-semibold text-foreground">{r.name}</span>
                    </div>
                    <Pill tone={sentPct >= 60 ? "positive" : sentPct >= 40 ? "info" : "warning"}>{sentPct}% pos</Pill>
                  </div>
                  <div className="mt-3">
                    <Bar label={`${r.count} artikel`} value={Math.round((r.count / max) * 100)} color="primary" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </PageShell>
  );
}
