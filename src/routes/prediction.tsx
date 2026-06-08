import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Activity, Brain, AlertTriangle, TrendingUp } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";
import { AINarrative } from "@/components/AINarrative";

export const Route = createFileRoute("/prediction")({
  head: () => ({ meta: [{ title: "Issue Prediction — TOC Sat Bantek" }, { name: "description", content: "Prediksi tren berdasarkan news database." }] }),
  component: Page,
});

function Page() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);

  // 14 buckets: index 0..6 = last 7 historical days (today-6..today),
  //             index 7..13 = projection (today+1..today+7)
  const dayBuckets = Array.from({ length: 14 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - 6 + i);
    const start = day.getTime();
    const end = start + 86400000;
    const isPrediction = i > 6;
    const count = !isPrediction
      ? filtered.filter(
          (a) =>
            a.published_at &&
            new Date(a.published_at).getTime() >= start &&
            new Date(a.published_at).getTime() < end,
        ).length
      : null;
    return {
      d: day.toLocaleDateString("id-ID", { month: "short", day: "2-digit" }),
      v: count,
      isPrediction,
    };
  });

  // Linear regression on historical 7 days (x = 0..6)
  const hist = dayBuckets.slice(0, 7).map((b, i) => ({ x: i, y: (b.v as number) ?? 0 }));
  const n = hist.length;
  const sumX = hist.reduce((a, h) => a + h.x, 0);
  const sumY = hist.reduce((a, h) => a + h.y, 0);
  const sumXY = hist.reduce((a, h) => a + h.x * h.y, 0);
  const sumXX = hist.reduce((a, h) => a + h.x * h.x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const trend = dayBuckets.map((b, i) => ({
    d: b.d,
    actual: i <= 6 ? (b.v as number) : null,
    // overlap last actual point with prediction line for continuity
    predicted: i >= 6 ? Math.max(0, Math.round(intercept + slope * i)) : null,
  }));

  // Metrics — based on last 7 historical days
  const avgDaily = sumY / 7;
  // Growth: compare projected last day (day 13) vs current avg, or use slope ratio
  const firstHalf = hist.slice(0, 3).reduce((a, h) => a + h.y, 0) / 3;
  const lastHalf = hist.slice(4, 7).reduce((a, h) => a + h.y, 0) / 3;
  const growth = firstHalf > 0
    ? Math.round(((lastHalf - firstHalf) / firstHalf) * 100)
    : lastHalf > 0
      ? 100
      : 0;
  const projectionHPlus7 = Math.max(0, Math.round(intercept + slope * 13));

  const topKeywords = s.keywords.slice(0, 6);
  const maxKw = topKeywords[0]?.count ?? 1;

  return (
    <PageShell eyebrow="Forecast" title="Prediksi Isu" description="Proyeksi volume artikel berdasarkan data 7 hari terakhir. Disaring berdasarkan kata kunci aktif.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Artikel" value={String(s.total)} accent="cyan" icon={<Activity className="h-5 w-5" />} hint={active ? "Filtered" : "All"} />
        <MetricCard label="Tren Pertumbuhan" value={`${growth >= 0 ? "+" : ""}${growth}%`} accent={growth >= 0 ? "success" : "danger"} icon={<TrendingUp className="h-5 w-5" />} hint="3 hari awal vs 3 hari akhir" />
        <MetricCard label="Rata-rata Harian" value={avgDaily.toFixed(1)} accent="violet" icon={<Brain className="h-5 w-5" />} hint="7 hari terakhir" />
        <MetricCard label="Proyeksi H+7" value={String(projectionHPlus7)} accent="amber" icon={<AlertTriangle className="h-5 w-5" />} hint="Regresi linier" />
      </div>

      <Panel className="mt-6" title="Trend Prediksi — 7 Hari ke Depan" icon={<Activity className="h-4 w-4" />} action={<Pill tone="info">Linear regression</Pill>}>
        {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p> : s.total === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data untuk prediksi.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.18 195)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 195)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="d" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="actual" stroke="oklch(0.78 0.18 195)" fill="url(#pg)" strokeWidth={2} name="Aktual" />
                <Area type="monotone" dataKey="predicted" stroke="oklch(0.82 0.18 80)" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Prediksi" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel className="mt-6" title="Topik yang Diprediksi Naik" icon={<TrendingUp className="h-4 w-4" />}>
        {topKeywords.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Belum ada keyword di artikel untuk diprediksi.</p>
        ) : (
          <ul className="divide-y divide-border">
            {topKeywords.map((k) => (
              <li key={k.name} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-foreground">{k.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{k.count} mentions saat ini</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-cyan" style={{ width: `${Math.round((k.count / maxKw) * 100)}%` }} />
                  </div>
                  <Pill tone="info">{Math.round((k.count / maxKw) * 100)}%</Pill>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <AINarrative
        className="mt-6"
        page="Prediksi Isu"
        context={{
          total_artikel: s.total,
          historis_7_hari: hist.map((h) => h.y),
          rata_rata_harian: Number(avgDaily.toFixed(2)),
          tren_pertumbuhan_persen: growth,
          slope_per_hari: Number(slope.toFixed(2)),
          proyeksi_h_plus_7: projectionHPlus7,
          proyeksi_7_hari: trend.slice(7).map((t) => t.predicted),
          top_keywords: topKeywords.map((k) => `${k.name}(${k.count})`),
          filter_aktif: active?.name ?? null,
        }}
      />
    </PageShell>
  );
}
