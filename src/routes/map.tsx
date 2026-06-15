import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, Panel, MetricCard, Pill, Bar } from "@/components/PageShell";
import { Map as MapIcon, MapPin, TrendingUp, Activity, X, ExternalLink } from "lucide-react";
import { useFilteredArticles } from "@/hooks/use-filtered-articles";
import { IndonesiaMap, articleMatchesProvince } from "@/components/IndonesiaMap";
import { resolveArticleProvince } from "@/lib/province-detect";
import { AINarrative } from "@/components/AINarrative";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Peta Indonesia — TOC Sat Bantek" },
      { name: "description", content: "Distribusi berita per provinsi pada peta interaktif Indonesia." },
    ],
  }),
  component: Page,
});

function Page() {
  const { filtered, loading, active } = useFilteredArticles();
  const [selected, setSelected] = useState<string | null>(null);

  // Enrich articles with detected province (from region OR scanned text fields).
  const enrichedArticles = useMemo(
    () => filtered.map((a) => ({ ...a, region: resolveArticleProvince(a) ?? a.region })),
    [filtered],
  );

  // Province ranking based on enriched region.
  const regionRanking = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of enrichedArticles) {
      if (!a.region) continue;
      m.set(a.region, (m.get(a.region) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [enrichedArticles]);

  const totalDetected = regionRanking.reduce((sum, r) => sum + r.count, 0);
  const totalPositive = enrichedArticles.filter((a) => a.sentiment === "positive").length;
  const pctPosOverall = enrichedArticles.length
    ? Math.round((totalPositive / enrichedArticles.length) * 100)
    : 0;

  const provinceArticles = useMemo(
    () =>
      selected
        ? enrichedArticles.filter((a) => articleMatchesProvince(a.region, selected))
        : [],
    [selected, enrichedArticles],
  );

  const provStats = useMemo(() => {
    const pos = provinceArticles.filter((a) => a.sentiment === "positive").length;
    const neg = provinceArticles.filter((a) => a.sentiment === "negative").length;
    const neu = provinceArticles.filter((a) => a.sentiment === "neutral").length;
    const total = provinceArticles.length;
    const sources = new Map<string, number>();
    for (const a of provinceArticles) sources.set(a.source, (sources.get(a.source) ?? 0) + 1);
    return {
      total,
      pos,
      neg,
      neu,
      pctPos: total ? Math.round((pos / total) * 100) : 0,
      pctNeg: total ? Math.round((neg / total) * 100) : 0,
      pctNeu: total ? Math.round((neu / total) * 100) : 0,
      sources: [...sources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [provinceArticles]);

  return (
    <PageShell
      eyebrow="Geographic Intelligence"
      title="Peta Indonesia"
      description="Distribusi berita per provinsi — klik wilayah pada peta untuk melihat analisa berita."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Provinsi Terpantau" value={String(regionRanking.length)} icon={<MapPin className="h-5 w-5" />} accent="cyan" hint={active ? "Filtered" : "All"} />
        <MetricCard label="Total Artikel Terpetakan" value={String(totalDetected)} icon={<Activity className="h-5 w-5" />} accent="success" hint={`dari ${enrichedArticles.length} total`} />
        <MetricCard label="Hotspot" value={regionRanking[0]?.name ?? "—"} icon={<TrendingUp className="h-5 w-5" />} accent="amber" hint={`${regionRanking[0]?.count ?? 0} mentions`} />
        <MetricCard label="Sentiment Positif" value={`${pctPosOverall}%`} icon={<Activity className="h-5 w-5" />} accent="violet" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Peta Provinsi Indonesia" icon={<MapIcon className="h-4 w-4" />}>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p>
          ) : (
            <IndonesiaMap articles={enrichedArticles} selected={selected} onSelect={setSelected} />
          )}
        </Panel>

        <Panel title={selected ? `Analisa: ${selected}` : "Detail Provinsi"} icon={<MapPin className="h-4 w-4" />}>
          {!selected ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Klik salah satu provinsi pada peta untuk melihat analisa berita.
            </p>
          ) : provStats.total === 0 ? (
            <div className="space-y-3">
              <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <X className="h-3 w-3" /> Tutup
              </button>
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada artikel terlabel untuk provinsi ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {provStats.total} artikel
                </span>
                <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                  <X className="h-3 w-3" /> Tutup
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md border border-border bg-panel-elevated p-2">
                  <div className="text-lg font-bold text-success">{provStats.pctPos}%</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Positif</div>
                </div>
                <div className="rounded-md border border-border bg-panel-elevated p-2">
                  <div className="text-lg font-bold text-muted-foreground">{provStats.pctNeu}%</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Netral</div>
                </div>
                <div className="rounded-md border border-border bg-panel-elevated p-2">
                  <div className="text-lg font-bold text-destructive">{provStats.pctNeg}%</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Negatif</div>
                </div>
              </div>

              {provStats.sources.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Top Sumber</p>
                  <div className="space-y-1.5">
                    {provStats.sources.map(([name, count]) => (
                      <Bar key={name} label={`${name} · ${count}`} value={Math.round((count / provStats.total) * 100)} color="primary" />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Artikel Terbaru</p>
                <ul className="space-y-2">
                  {provinceArticles.slice(0, 6).map((a) => (
                    <li key={a.id} className="rounded-md border border-border bg-panel-elevated p-2">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary">{a.title}</p>
                          <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                            {a.source} · {a.published_at ? new Date(a.published_at).toLocaleDateString("id-ID") : "—"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {a.sentiment && (
                            <Pill tone={a.sentiment === "positive" ? "positive" : a.sentiment === "negative" ? "warning" : "info"}>
                              {a.sentiment}
                            </Pill>
                          )}
                          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="mt-6" title="Ranking Provinsi" icon={<MapIcon className="h-4 w-4" />}>
        {regionRanking.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Belum ada artikel yang dapat dipetakan ke provinsi.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {regionRanking.map((r, i) => {
              const maxC = regionRanking[0]?.count ?? 1;
              return (
                <li key={r.name}>
                  <button
                    onClick={() => setSelected(r.name)}
                    className="w-full rounded-lg border border-border bg-panel-elevated p-3 text-left transition hover:border-primary/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        <span className="mr-2 font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                        {r.name}
                      </span>
                      <Pill tone="info">{r.count}</Pill>
                    </div>
                    <div className="mt-2">
                      <Bar label={`${r.count} artikel`} value={Math.round((r.count / maxC) * 100)} color="primary" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <AINarrative
        className="mt-6"
        page="Peta Indonesia — Distribusi Provinsi"
        context={{
          total_artikel: enrichedArticles.length,
          total_artikel_terdeteksi_provinsi: totalDetected,
          persen_positif_keseluruhan: pctPosOverall,
          ranking_provinsi: regionRanking.slice(0, 15).map((r) => `${r.name}(${r.count})`),
          provinsi_dipilih: selected,
          jumlah_artikel_provinsi_dipilih: selected ? provinceArticles.length : null,
          judul_berita: (selected ? provinceArticles : enrichedArticles).slice(0, 20).map((a) => ({ judul: a.title, provinsi: a.region, sumber: a.source })),
          filter_aktif: active?.name ?? null,
        }}
      />
    </PageShell>
  );
}
