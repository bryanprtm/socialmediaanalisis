import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Activity, Brain, AlertTriangle, TrendingUp } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";

export const Route = createFileRoute("/prediction")({
  head: () => ({ meta: [{ title: "Issue Prediction — PROPAM" }, { name: "description", content: "Prediksi tren berdasarkan news database." }] }),
  component: Page,
});

function Page() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);

  // Build 14-day trend (last 7 historical + projected 7 via linear regression)
  const dayBuckets = Array.from({ length: 14 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (13 - i));
    const start = day.getTime();
    const end = start + 86400000;
    const count = i < 7
      ? filtered.filter((a) => a.published_at && new Date(a.published_at).getTime() >= start && new Date(a.published_at).getTime() < end).length
      : null;
    return { d: day.toLocaleDateString("id-ID", { month: "short", day: "2-digit" }), v: count, isPrediction: i >= 7 };
  });

  // Linear regression over first 7 to project next 7
  const hist = dayBuckets.slice(0, 7).map((b, i) => ({ x: i, y: b.v as number }));
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
    actual: i < 7 ? b.v : null,
    predicted: i >= 6 ? Math.max(0, Math.round(intercept + slope * i)) : null,
  }));

  const growth = sumY > 0 ? Math.round((slope * 7 / (sumY / 7)) * 100) : 0;
  const topKeywords = s.keywords.slice(0, 6);
  const maxKw = topKeywords[0]?.count ?? 1;

  return (
    <PageShell eyebrow="Forecast" title="Prediksi Isu" description="Proyeksi volume artikel berdasarkan data 7 hari terakhir. Disaring berdasarkan kata kunci aktif.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Artikel" value={String(s.total)} accent="cyan" icon={<Activity className="h-5 w-5" />} hint={active ? "Filtered" : "All"} />
        <MetricCard label="Tren Pertumbuhan" value={`${growth >= 0 ? "+" : ""}${growth}%`} accent={growth >= 0 ? "success" : "danger"} icon={<TrendingUp className="h-5 w-5" />} hint="7 hari" />
        <MetricCard label="Rata-rata Harian" value={String(Math.round(sumY / 7))} accent="violet" icon={<Brain className="h-5 w-5" />} />
        <MetricCard label="Proyeksi H+7" value={String(Math.max(0, Math.round(intercept + slope * 13)))} accent="amber" icon={<AlertTriangle className="h-5 w-5" />} />
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
    </PageShell>
  );
}
