import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Bar, Pill } from "@/components/PageShell";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Brain, Target, Hash, Newspaper } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";
import { AINarrative } from "@/components/AINarrative";
import { useArticleDialog } from "@/components/ArticleDialog";

export const Route = createFileRoute("/sentiment")({
  head: () => ({
    meta: [
      { title: "Sentiment Analysis — PROPAM Command Center" },
      { name: "description", content: "Analisis sentiment dari news database." },
    ],
  }),
  component: SentimentPage,
});

function SentimentPage() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);
  const dialog = useArticleDialog();
  const openSent = (label: string, sent: "positive" | "neutral" | "negative") =>
    dialog.open({ title: `Sentimen ${label}`, articles: filtered.filter((a) => a.sentiment === sent) });
  const dist = [
    { name: "Positif", value: s.pos, color: "oklch(0.78 0.2 150)", sent: "positive" as const },
    { name: "Netral", value: s.neu, color: "oklch(0.65 0.02 240)", sent: "neutral" as const },
    { name: "Negatif", value: s.neg, color: "oklch(0.65 0.24 22)", sent: "negative" as const },
  ];
  const topKw = s.keywords.slice(0, 8);
  const topSrc = s.sources.slice(0, 6);

  return (
    <PageShell
      eyebrow="Sentiment Module"
      title="Analisis Sentiment"
      description="Distribusi sentiment artikel real-time. Disaring berdasarkan kata kunci aktif."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Artikel" value={String(s.total)} accent="cyan" icon={<Newspaper className="h-5 w-5" />} hint={active ? "Filtered" : "All"} />
        <MetricCard label="Sentiment Positif" value={`${s.pctPos}%`} accent="success" icon={<Target className="h-5 w-5" />} hint={`${s.pos} artikel`} />
        <MetricCard label="Sentiment Negatif" value={`${s.pctNeg}%`} accent="danger" icon={<Target className="h-5 w-5" />} hint={`${s.neg} artikel`} />
        <MetricCard label="Sentiment Netral" value={`${s.pctNeu}%`} accent="violet" icon={<Target className="h-5 w-5" />} hint={`${s.neu} artikel`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Distribusi Sentiment" icon={<Brain className="h-4 w-4" />}>
          {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p> : s.total === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{active ? "Tidak ada artikel cocok." : "Belum ada artikel."}</p>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dist.filter((d) => d.value > 0)} dataKey="value" innerRadius={56} outerRadius={84} paddingAngle={2}>
                      {dist.map((d, i) => <Cell key={i} fill={d.color} stroke="oklch(0.18 0.03 252)" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-2">
                {dist.map((d) => (
                  <li key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-foreground">{d.name}</span>
                    </span>
                    <span className="font-mono font-semibold text-foreground">{d.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Panel title="Detail Sentiment" icon={<Target className="h-4 w-4" />}>
          <div className="space-y-4">
            <Bar label={`Positif (${s.pos})`} value={s.pctPos} color="success" />
            <Bar label={`Negatif (${s.neg})`} value={s.pctNeg} color="danger" />
            <Bar label={`Netral (${s.neu})`} value={s.pctNeu} color="neutral" />
          </div>
          <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Artikel</span>
              <span className="font-mono font-semibold text-foreground">{s.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tanpa label sentiment</span>
              <Pill tone="info">{s.total - s.pos - s.neg - s.neu}</Pill>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Keyword Teratas" icon={<Hash className="h-4 w-4" />}>
          {topKw.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Belum ada keyword.</p> : (
            <ul className="space-y-2">
              {topKw.map((k, i) => (
                <li key={k.name} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">#{i + 1}</span>
                    <p className="text-sm font-semibold text-foreground">{k.name}</p>
                  </div>
                  <Pill tone="info">{k.count}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Sentiment per Sumber" icon={<Newspaper className="h-4 w-4" />}>
          {topSrc.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Belum ada sumber.</p> : (
            <ul className="space-y-3">
              {topSrc.map((src) => {
                const items = filtered.filter((a) => a.source === src.name);
                const p = Math.round((items.filter((a) => a.sentiment === "positive").length / Math.max(1, items.length)) * 100);
                const n = Math.round((items.filter((a) => a.sentiment === "negative").length / Math.max(1, items.length)) * 100);
                const u = 100 - p - n;
                return (
                  <li key={src.name} className="rounded-lg border border-border bg-panel-elevated p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{src.name}</span>
                      <Pill tone="info">{src.count} artikel</Pill>
                    </div>
                    <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                      <div className="bg-success" style={{ width: `${p}%` }} />
                      <div className="bg-muted-foreground/50" style={{ width: `${u}%` }} />
                      <div className="bg-destructive" style={{ width: `${n}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                      <span>Pos {p}%</span><span>Neu {u}%</span><span>Neg {n}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <AINarrative
        className="mt-6"
        page="Analisis Sentiment"
        context={{
          total: s.total,
          positif: s.pos,
          negatif: s.neg,
          netral: s.neu,
          persen_positif: s.pctPos,
          persen_negatif: s.pctNeg,
          persen_netral: s.pctNeu,
          top_keywords: topKw.map((k) => `${k.name}(${k.count})`),
          top_sumber: topSrc.map((src) => `${src.name}(${src.count})`),
          filter_aktif: active?.name ?? null,
        }}
      />
    </PageShell>
  );
}
