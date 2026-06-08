import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { Globe, Activity, ShieldCheck, Users } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";
import { AINarrative } from "@/components/AINarrative";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Analysis — PROPAM Command Center" },
      { name: "description", content: "Performa sumber media dari news database." },
    ],
  }),
  component: MediaPage,
});

function MediaPage() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);
  const max = s.sources[0]?.count ?? 1;

  // Per-source sentiment breakdown
  const perSource = s.sources.map((src) => {
    const items = filtered.filter((a) => a.source === src.name);
    const p = items.filter((a) => a.sentiment === "positive").length;
    const n = items.filter((a) => a.sentiment === "negative").length;
    const u = items.filter((a) => a.sentiment === "neutral").length;
    const total = items.length;
    return {
      name: src.name,
      count: src.count,
      pos: total ? Math.round((p / total) * 100) : 0,
      neg: total ? Math.round((n / total) * 100) : 0,
      neu: total ? Math.round((u / total) * 100) : 0,
    };
  });

  return (
    <PageShell
      eyebrow="Source Intelligence"
      title="Analisis Media"
      description="Performa & sentiment sumber media — dihitung langsung dari news database. Tersaring berdasarkan kata kunci aktif."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Artikel" value={String(s.total)} accent="cyan" icon={<Activity className="h-5 w-5" />} hint={active ? "Filtered" : "All"} />
        <MetricCard label="Sumber Unik" value={String(s.sources.length)} accent="success" icon={<Globe className="h-5 w-5" />} />
        <MetricCard label="Sentiment Positif" value={`${s.pctPos}%`} accent="violet" icon={<ShieldCheck className="h-5 w-5" />} />
        <MetricCard label="Kategori" value={String(s.categories.length)} accent="amber" icon={<Users className="h-5 w-5" />} />
      </div>

      <Panel className="mt-6" title="Sumber Media" icon={<Globe className="h-4 w-4" />} action={<Pill tone="info">{s.sources.length} sumber</Pill>}>
        {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p> : perSource.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{active ? "Tidak ada sumber cocok dengan filter aktif." : "Belum ada artikel di database."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Media</th>
                  <th className="pb-3 pr-4">Artikel</th>
                  <th className="pb-3 pr-4">Volume</th>
                  <th className="pb-3 pr-4">Sentiment Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {perSource.map((s2) => (
                  <tr key={s2.name} className="hover:bg-panel-elevated/60">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-cyan font-mono text-xs font-bold text-background">{s2.name.charAt(0)}</span>
                        <p className="font-semibold text-foreground">{s2.name}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono font-semibold text-foreground">{s2.count}</td>
                    <td className="py-3 pr-4">
                      <div className="flex w-32 items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-gradient-cyan" style={{ width: `${Math.round((s2.count / max) * 100)}%` }} />
                        </div>
                        <span className="font-mono text-[11px] text-foreground">{Math.round((s2.count / max) * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex h-2 w-40 overflow-hidden rounded-full">
                        <div className="bg-success" style={{ width: `${s2.pos}%` }} />
                        <div className="bg-muted-foreground/50" style={{ width: `${s2.neu}%` }} />
                        <div className="bg-destructive" style={{ width: `${s2.neg}%` }} />
                      </div>
                      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                        <span>+{s2.pos}%</span><span>·{s2.neu}%</span><span>-{s2.neg}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="mt-6" title="Distribusi Kategori">
        {s.categories.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Belum ada kategori artikel.</p>
        ) : (
          <ul className="divide-y divide-border">
            {s.categories.slice(0, 8).map((c) => {
              const items = filtered.filter((a) => a.category === c.name);
              const p = Math.round((items.filter((a) => a.sentiment === "positive").length / Math.max(1, items.length)) * 100);
              const n = Math.round((items.filter((a) => a.sentiment === "negative").length / Math.max(1, items.length)) * 100);
              const u = 100 - p - n;
              return (
                <li key={c.name} className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[1fr_auto_auto_auto]">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{c.count} artikel</p>
                  </div>
                  <span className="font-mono text-xs text-success">+{p}% Pos</span>
                  <span className="font-mono text-xs text-muted-foreground">{u}% Neu</span>
                  <span className="font-mono text-xs text-destructive">-{n}% Neg</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <AINarrative
        className="mt-6"
        page="Analisis Media"
        context={{
          total_artikel: s.total,
          sumber_unik: s.sources.length,
          per_sumber: perSource.slice(0, 10),
          per_kategori: s.categories.slice(0, 8).map((c) => `${c.name}(${c.count})`),
          filter_aktif: active?.name ?? null,
        }}
      />
    </PageShell>
  );
}
