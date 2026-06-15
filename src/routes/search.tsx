import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { Globe, FileText, TrendingUp, ExternalLink, KeyRound, Sparkles } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";
import { AINarrative } from "@/components/AINarrative";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search & Monitoring — TOC Sat Bantek" },
      { name: "description", content: "Pencarian berita real-time dari news database." },
    ],
  }),
  component: Page,
});

function Page() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);
  const results = filtered.slice(0, 30);
  const topSources = s.sources.slice(0, 8);
  const maxSrc = topSources[0]?.count ?? 1;

  return (
    <PageShell
      eyebrow="Search Intelligence"
      title="Pencarian & Monitoring"
      description="Hasil pencarian disaring berdasarkan kata kunci aktif. Kelola kata kunci di halaman Kata Kunci Pencarian."
    >
      <Panel>
        {active ? (
          <div className="flex flex-wrap items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Query aktif:</span>
            <span className="text-sm text-foreground">{active.name}</span>
            <code className="rounded-md border border-primary/30 bg-panel-elevated px-2 py-0.5 font-mono text-xs text-primary">{active.expression}</code>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{filtered.length} hasil cocok</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Belum ada kata kunci aktif. Pilih query di dropdown TopNav atau{" "}
              <Link to="/keywords" className="text-primary hover:underline">tambahkan di halaman Kata Kunci →</Link>
            </p>
          </div>
        )}
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Hasil" value={String(filtered.length)} icon={<FileText className="h-5 w-5" />} accent="cyan" hint={active ? "Filtered" : "Semua"} />
        <MetricCard label="Sumber" value={String(s.sources.length)} icon={<Globe className="h-5 w-5" />} accent="violet" />
        <MetricCard label="Positif" value={`${s.pctPos}%`} icon={<TrendingUp className="h-5 w-5" />} accent="success" />
        <MetricCard label="Negatif" value={`${s.pctNeg}%`} icon={<TrendingUp className="h-5 w-5" />} accent="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Hasil Pencarian" icon={<FileText className="h-4 w-4" />} action={<span className="font-mono text-xs text-muted-foreground">{results.length} dari {filtered.length}</span>}>
          {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p> : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{active ? "Tidak ada hasil cocok." : "Belum ada artikel di database."}</p>
          ) : (
            <div className="max-h-[560px] overflow-y-auto pr-2">
              <ul className="divide-y divide-border">
                {results.map((r) => (
                  <li key={r.id} className="group py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:block">
                        <div className="rounded-lg border border-border bg-panel-elevated p-2.5"><FileText className="h-4 w-4 text-primary" /></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">{r.title}</h3>
                          {r.sentiment && <Pill tone={r.sentiment === "positive" ? "positive" : r.sentiment === "negative" ? "negative" : "neutral"}>{r.sentiment}</Pill>}
                        </div>
                        {r.excerpt && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{r.excerpt}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                          <span className="text-primary">{r.source}</span>
                          {r.category && <><span>·</span><Pill tone="info">{r.category}</Pill></>}
                          <a href={r.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-primary hover:underline">
                            Read <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Top Sumber" icon={<Globe className="h-4 w-4" />}>
          {topSources.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Belum ada sumber.</p> : (
            <ul className="space-y-3">
              {topSources.map((src) => (
                <li key={src.name} className="rounded-lg border border-border bg-panel-elevated p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{src.name}</span>
                    <span className="font-mono text-xs font-bold text-primary">{src.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-cyan" style={{ width: `${Math.round((src.count / maxSrc) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <AINarrative
        className="mt-6"
        page="Pencarian & Monitoring"
        context={{
          query_aktif: active?.name ?? null,
          ekspresi: active?.expression ?? null,
          total_hasil: filtered.length,
          ditampilkan: results.length,
          sentiment: { positif_pct: s.pctPos, negatif_pct: s.pctNeg, netral_pct: s.pctNeu },
          top_sumber: topSources.map((x) => `${x.name}(${x.count})`),
          top_kategori: s.categories.slice(0, 8).map((c) => `${c.name}(${c.count})`),
          contoh_judul: results.slice(0, 10).map((r) => r.title),
        }}
      />
    </PageShell>
  );
}
