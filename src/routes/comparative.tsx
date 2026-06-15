import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { PageShell, Panel, Pill } from "@/components/PageShell";
import { ResponsiveContainer, BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { GitCompare, TrendingUp } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";
import { AINarrative } from "@/components/AINarrative";

export const Route = createFileRoute("/comparative")({
  head: () => ({ meta: [{ title: "Comparative Analysis — TOC Sat Bantek" }, { name: "description", content: "Bandingkan sumber media dari news database." }] }),
  component: Page,
});

function Page() {
  const { filtered, loading } = useFilteredArticles();
  const s = summarize(filtered);
  const sourceNames = s.sources.map((x) => x.name);
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");

  useEffect(() => {
    if (!a && sourceNames[0]) setA(sourceNames[0]);
    if (!b && sourceNames[1]) setB(sourceNames[1]);
  }, [sourceNames, a, b]);

  function statsFor(name: string) {
    const items = filtered.filter((x) => x.source === name);
    const total = items.length;
    const pos = items.filter((x) => x.sentiment === "positive").length;
    const neg = items.filter((x) => x.sentiment === "negative").length;
    const neu = items.filter((x) => x.sentiment === "neutral").length;
    return {
      total,
      pos: total ? Math.round((pos / total) * 100) : 0,
      neg: total ? Math.round((neg / total) * 100) : 0,
      neu: total ? Math.round((neu / total) * 100) : 0,
    };
  }

  const sA = useMemo(() => statsFor(a), [a, filtered]);
  const sB = useMemo(() => statsFor(b), [b, filtered]);

  const chart = [
    { metric: "Total", A: sA.total, B: sB.total },
    { metric: "Positif %", A: sA.pos, B: sB.pos },
    { metric: "Negatif %", A: sA.neg, B: sB.neg },
    { metric: "Netral %", A: sA.neu, B: sB.neu },
  ];

  return (
    <PageShell eyebrow="Side-by-Side" title="Analisis Komparatif" description="Bandingkan performa sumber media — dihitung dari news database.">
      <Panel title="Pilih Sumber" icon={<GitCompare className="h-4 w-4" />}>
        {loading ? <p className="py-6 text-center text-sm text-muted-foreground">Memuat…</p> : sourceNames.length < 2 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Butuh minimal 2 sumber untuk perbandingan.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Source A</p>
              <select value={a} onChange={(e) => setA(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground">
                {sourceNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Source B</p>
              <select value={b} onChange={(e) => setB(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground">
                {sourceNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        )}
      </Panel>

      {sourceNames.length >= 2 && (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Panel title={a || "Source A"}>
              <ul className="space-y-2">
                <Row label="Total Artikel" value={sA.total} />
                <Row label="Positif" value={`${sA.pos}%`} tone="positive" />
                <Row label="Negatif" value={`${sA.neg}%`} tone="negative" />
                <Row label="Netral" value={`${sA.neu}%`} />
              </ul>
            </Panel>
            <Panel title={b || "Source B"}>
              <ul className="space-y-2">
                <Row label="Total Artikel" value={sB.total} />
                <Row label="Positif" value={`${sB.pos}%`} tone="positive" />
                <Row label="Negatif" value={`${sB.neg}%`} tone="negative" />
                <Row label="Netral" value={`${sB.neu}%`} />
              </ul>
            </Panel>
          </div>

          <Panel className="mt-6" title="Perbandingan Visual" icon={<TrendingUp className="h-4 w-4" />}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="metric" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                  <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <RBar dataKey="A" name={a} fill="oklch(0.78 0.18 195)" radius={[4, 4, 0, 0]} />
                  <RBar dataKey="B" name={b} fill="oklch(0.65 0.24 22)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      )}

      {sourceNames.length >= 2 && (
        <AINarrative
          className="mt-6"
          page="Analisis Komparatif Sumber Media"
          context={{
            sumber_A: { nama: a, total: sA.total, positif_pct: sA.pos, negatif_pct: sA.neg, netral_pct: sA.neu },
            sumber_B: { nama: b, total: sB.total, positif_pct: sB.pos, negatif_pct: sB.neg, netral_pct: sB.neu },
            judul_berita_A: filtered.filter((x) => x.source === a).slice(0, 12).map((x) => ({ judul: x.title, sentimen: x.sentiment })),
            judul_berita_B: filtered.filter((x) => x.source === b).slice(0, 12).map((x) => ({ judul: x.title, sentimen: x.sentiment })),
            jumlah_sumber_tersedia: sourceNames.length,
          }}
        />
      )}
    </PageShell>
  );
}

function Row({ label, value, tone }: { label: string; value: number | string; tone?: "positive" | "negative" }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      {tone ? <Pill tone={tone}>{value}</Pill> : <span className="font-mono text-sm font-bold text-foreground">{value}</span>}
    </li>
  );
}
