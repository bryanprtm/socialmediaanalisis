import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Radio,
  AlertTriangle,
  Siren,
  Newspaper,
  TrendingUp,
  Activity,
  MapPin,
  Sparkles,
  Bell,
  Flame,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";
import { IndonesiaMap } from "@/components/IndonesiaMap";
import { AINarrative } from "@/components/AINarrative";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/command-center")({
  head: () => ({
    meta: [
      { title: "Command Center — TOC Sat Bantek" },
      {
        name: "description",
        content:
          "Command Center Mode: real-time news, map, timeline, alert engine, breaking news, dan AI early warning system.",
      },
    ],
  }),
  component: CommandCenterPage,
});

/* -------------------- helpers -------------------- */

function useClock() {
  const [t, setT] = useState<Date | null>(null);
  useEffect(() => {
    setT(new Date());
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

type Level = "normal" | "waspada" | "krisis";

function levelFromSurge(pct: number, negPct: number): Level {
  if (pct >= 300 || negPct >= 70) return "krisis";
  if (pct >= 100 || negPct >= 50) return "waspada";
  return "normal";
}

function levelStyle(l: Level) {
  if (l === "krisis")
    return {
      label: "🔴 KRISIS",
      chip: "bg-destructive/20 text-destructive border-destructive/40",
      ring: "shadow-[0_0_40px_oklch(0.65_0.24_22_/_0.35)] border-destructive/50",
    };
  if (l === "waspada")
    return {
      label: "🟠 WASPADA",
      chip: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      ring: "shadow-[0_0_40px_oklch(0.75_0.18_60_/_0.3)] border-amber-500/50",
    };
  return {
    label: "🟢 NORMAL",
    chip: "bg-success/15 text-success border-success/30",
    ring: "border-border",
  };
}

/* -------------------- page -------------------- */

function CommandCenterPage() {
  const clock = useClock();
  const { filtered, loading } = useFilteredArticles();
  const s = summarize(filtered);

  const nowMs = clock?.getTime() ?? Date.now();

  // baseline: rata-rata artikel/hari 30 hari terakhir (exclude hari ini)
  const { todayCount, baselineAvg, surgePct } = useMemo(() => {
    const dayMs = 24 * 3600 * 1000;
    const startToday = new Date(nowMs);
    startToday.setHours(0, 0, 0, 0);
    const startTodayMs = startToday.getTime();
    const start30 = startTodayMs - 30 * dayMs;

    let today = 0;
    const perDay = new Map<number, number>();
    for (const a of filtered) {
      if (!a.published_at) continue;
      const t = new Date(a.published_at).getTime();
      if (t >= startTodayMs) today++;
      else if (t >= start30) {
        const d = Math.floor((t - start30) / dayMs);
        perDay.set(d, (perDay.get(d) ?? 0) + 1);
      }
    }
    const counts = Array.from(perDay.values());
    const avg = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
    const pct = avg > 0 ? Math.round(((today - avg) / avg) * 100) : today > 0 ? 999 : 0;
    return { todayCount: today, baselineAvg: Math.round(avg), surgePct: pct };
  }, [filtered, nowMs]);

  // negatif last 24h
  const neg24h = useMemo(() => {
    const cutoff = nowMs - 24 * 3600 * 1000;
    const arr = filtered.filter(
      (a) => a.published_at && new Date(a.published_at).getTime() >= cutoff,
    );
    const neg = arr.filter((a) => a.sentiment === "negative").length;
    const negPct = arr.length ? Math.round((neg / arr.length) * 100) : 0;
    return { total: arr.length, neg, negPct };
  }, [filtered, nowMs]);

  const level = levelFromSurge(surgePct, neg24h.negPct);
  const style = levelStyle(level);

  // timeline 24 jam per jam
  const timeline = useMemo(() => {
    const buckets: { t: string; total: number; neg: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const end = nowMs - i * 3600 * 1000;
      const start = end - 3600 * 1000;
      const items = filtered.filter((a) => {
        if (!a.published_at) return false;
        const tt = new Date(a.published_at).getTime();
        return tt >= start && tt < end;
      });
      const d = new Date(end);
      buckets.push({
        t: `${String(d.getHours()).padStart(2, "0")}:00`,
        total: items.length,
        neg: items.filter((x) => x.sentiment === "negative").length,
      });
    }
    return buckets;
  }, [filtered, nowMs]);

  // breaking news: 5 negatif terbaru
  const breaking = useMemo(() => {
    return [...filtered]
      .filter((a) => a.sentiment === "negative" && a.published_at)
      .sort(
        (a, b) =>
          new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime(),
      )
      .slice(0, 6);
  }, [filtered]);

  // running text: 15 headline terbaru
  const ticker = useMemo(() => {
    return [...filtered]
      .filter((a) => a.published_at)
      .sort(
        (a, b) =>
          new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime(),
      )
      .slice(0, 15);
  }, [filtered]);

  // Alert Engine: per-keyword deteksi lonjakan 15 menit
  const alerts = useMemo(() => {
    const window = 15 * 60 * 1000;
    const cutoff = nowMs - window;
    const kwMap = new Map<string, { total: number; neg: number }>();
    for (const a of filtered) {
      if (!a.published_at) continue;
      const t = new Date(a.published_at).getTime();
      if (t < cutoff) continue;
      const kws = a.keywords ?? [];
      for (const k of kws) {
        const key = k.toLowerCase();
        const cur = kwMap.get(key) ?? { total: 0, neg: 0 };
        cur.total++;
        if (a.sentiment === "negative") cur.neg++;
        kwMap.set(key, cur);
      }
    }
    const out: { keyword: string; total: number; neg: number; negPct: number; severity: Level }[] = [];
    for (const [k, v] of kwMap.entries()) {
      const negPct = v.total ? Math.round((v.neg / v.total) * 100) : 0;
      const trigger = negPct >= 70 || v.total >= 30;
      if (!trigger) continue;
      const sev: Level = negPct >= 70 && v.total >= 30 ? "krisis" : "waspada";
      out.push({ keyword: k, total: v.total, neg: v.neg, negPct, severity: sev });
    }
    return out.sort((a, b) => b.total - a.total).slice(0, 8);
  }, [filtered, nowMs]);

  const topKeywords = s.keywords.slice(0, 8);
  const topKwMax = topKeywords[0]?.count ?? 1;

  const timeStr = clock
    ? clock.toLocaleTimeString("id-ID", { hour12: false })
    : "--:--:--";
  const dateStr = clock
    ? clock.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <PageShell
      eyebrow="Command Center Mode"
      title="Situation Room"
      description="Live monitoring, alert engine, dan AI early warning untuk deteksi krisis media."
      actions={
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider ${style.chip}`}
          >
            <Siren className="h-3.5 w-3.5" /> {style.label}
          </span>
          <span className="hidden items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5 lg:inline-flex">
            <Radio className="h-3.5 w-3.5 animate-pulse-dot text-success" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {dateStr}
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">{timeStr}</span>
          </span>
        </div>
      }
    >
      {/* Running Text Ticker */}
      <div className="relative mb-5 overflow-hidden rounded-lg border border-primary/30 bg-panel-elevated">
        <div className="flex items-center gap-3 border-b border-border bg-primary/10 px-3 py-1.5">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Live Ticker
          </span>
        </div>
        <div className="relative h-8 overflow-hidden">
          <div className="ticker-track flex items-center gap-8 whitespace-nowrap px-4 font-mono text-xs text-foreground">
            {ticker.concat(ticker).map((a, i) => (
              <span key={`${a.id}-${i}`} className="inline-flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    a.sentiment === "negative"
                      ? "bg-destructive"
                      : a.sentiment === "positive"
                        ? "bg-success"
                        : "bg-muted-foreground"
                  }`}
                />
                <span className="text-muted-foreground">[{a.source}]</span>
                <span>{a.title}</span>
              </span>
            ))}
          </div>
        </div>
        <style>{`
          .ticker-track {
            position: absolute;
            top: 0; bottom: 0;
            align-items: center;
            animation: ticker 90s linear infinite;
          }
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* AI Early Warning */}
      <div
        className={`mb-5 rounded-xl border bg-panel p-5 ${style.ring} transition-all`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-lg p-2.5 ${
                level === "krisis"
                  ? "bg-destructive/20 text-destructive"
                  : level === "waspada"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-success/15 text-success"
              }`}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  AI Early Warning System
                </span>
                <span
                  className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${style.chip}`}
                >
                  {style.label}
                </span>
              </div>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                {level === "krisis"
                  ? "Krisis Terdeteksi — Eskalasi Diperlukan"
                  : level === "waspada"
                    ? "Lonjakan Anomali Terdeteksi"
                    : "Kondisi Media Terpantau Normal"}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Biasanya <span className="font-semibold text-foreground">{baselineAvg}</span>{" "}
                berita/hari · Hari ini{" "}
                <span className="font-semibold text-foreground">{todayCount}</span> berita{" "}
                <span
                  className={`font-mono text-xs font-bold ${
                    surgePct >= 100
                      ? "text-destructive"
                      : surgePct >= 50
                        ? "text-amber-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {surgePct >= 0 ? "▲" : "▼"} {Math.abs(surgePct)}%
                </span>{" "}
                · Sentimen negatif 24 jam{" "}
                <span className="font-semibold text-foreground">{neg24h.negPct}%</span> (
                {neg24h.neg}/{neg24h.total})
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-panel-elevated px-3 py-2 text-center">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Baseline
              </p>
              <p className="font-mono text-xl font-bold text-foreground">{baselineAvg}</p>
            </div>
            <div className="rounded-lg border border-border bg-panel-elevated px-3 py-2 text-center">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Hari ini
              </p>
              <p className="font-mono text-xl font-bold text-primary">{todayCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-panel-elevated px-3 py-2 text-center">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Lonjakan
              </p>
              <p
                className={`font-mono text-xl font-bold ${
                  surgePct >= 100
                    ? "text-destructive"
                    : surgePct >= 50
                      ? "text-amber-400"
                      : "text-success"
                }`}
              >
                {surgePct}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Berita"
          value={String(s.total)}
          icon={<Newspaper className="h-5 w-5" />}
          accent="cyan"
          hint={loading ? "Memuat…" : "Live feed"}
        />
        <MetricCard
          label="Negatif 24h"
          value={`${neg24h.negPct}%`}
          icon={<Bell className="h-5 w-5" />}
          accent="danger"
          hint={`${neg24h.neg} artikel`}
        />
        <MetricCard
          label="Alert Aktif"
          value={String(alerts.length)}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="amber"
          hint="15 menit terakhir"
        />
        <MetricCard
          label="Top Sumber"
          value={String(s.sources.length)}
          icon={<Sparkles className="h-5 w-5" />}
          accent="violet"
        />
      </div>

      {/* Main grid: News + Alert */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Breaking News */}
        <Panel
          className="lg:col-span-2"
          title="Breaking News"
          icon={<Flame className="h-4 w-4 text-destructive" />}
        >
          {breaking.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Tidak ada breaking news negatif saat ini.
            </p>
          ) : (
            <ul className="space-y-2">
              {breaking.map((a) => (
                <li
                  key={a.id}
                  className="group flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 transition-colors hover:border-destructive/40"
                >
                  <Flame className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
                      <Pill tone="negative">negative</Pill>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                      <span className="text-primary">{a.source}</span>
                      {a.category && <Pill tone="info">{a.category}</Pill>}
                      {a.published_at && (
                        <span>
                          {new Date(a.published_at).toLocaleString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      )}
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Buka <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/news"
            className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-primary hover:underline"
          >
            Semua Berita →
          </Link>
        </Panel>

        {/* Alert Engine */}
        <Panel
          title="Alert Engine"
          icon={<Siren className="h-4 w-4 text-amber-400" />}
        >
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Trigger: Negatif &gt; 70% · Artikel &gt; 30 / 15 menit
          </p>
          {alerts.length === 0 ? (
            <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-center">
              <p className="font-mono text-xs font-bold text-success">
                ✓ TIDAK ADA ALERT AKTIF
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Semua keyword dalam batas normal.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {alerts.map((al) => {
                const st = levelStyle(al.severity);
                return (
                  <li
                    key={al.keyword}
                    className={`rounded-lg border p-3 ${
                      al.severity === "krisis"
                        ? "border-destructive/40 bg-destructive/10"
                        : "border-amber-500/40 bg-amber-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">#{al.keyword}</span>
                      <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${st.chip}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                      <span>{al.total} artikel</span>
                      <span
                        className={
                          al.negPct >= 70 ? "text-destructive" : "text-amber-400"
                        }
                      >
                        {al.negPct}% negatif
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Timeline + Top Keyword/Sentiment */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Timeline 24 Jam"
          icon={<Activity className="h-4 w-4" />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="ccTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.18 195)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 195)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ccNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.24 22)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.65 0.24 22)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="t" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.03 252)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="oklch(0.78 0.18 195)"
                  fill="url(#ccTotal)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="neg"
                  stroke="oklch(0.65 0.24 22)"
                  fill="url(#ccNeg)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top Sentiment" icon={<Bell className="h-4 w-4" />}>
          <div className="space-y-3">
            <SentimentBar label="Positif" value={s.pctPos} count={s.pos} color="success" />
            <SentimentBar label="Netral" value={s.pctNeu} count={s.neu} color="muted" />
            <SentimentBar
              label="Negatif"
              value={s.pctNeg}
              count={s.neg}
              color="destructive"
            />
          </div>
          <div className="mt-4 rounded-lg border border-border bg-panel-elevated p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Total dianalisa
            </p>
            <p className="font-mono text-xl font-bold text-foreground">{s.total}</p>
          </div>
        </Panel>
      </div>

      {/* Map + Top Keyword */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Peta Sebaran"
          icon={<MapPin className="h-4 w-4" />}
        >
          <IndonesiaMap articles={filtered} selected={null} onSelect={() => {}} />
        </Panel>

        <Panel title="Top Keyword" icon={<TrendingUp className="h-4 w-4" />}>
          {topKeywords.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada keyword.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {topKeywords.map((k, i) => (
                <li
                  key={k.name}
                  className="rounded-lg border border-border bg-panel-elevated p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate text-sm font-semibold text-foreground">
                        #{k.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary">
                      {k.count}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-cyan"
                      style={{ width: `${Math.round((k.count / topKwMax) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <AINarrative
        className="mt-6"
        page="Command Center"
        context={{
          level,
          baseline_rata2: baselineAvg,
          hari_ini: todayCount,
          lonjakan_pct: surgePct,
          negatif_24h_pct: neg24h.negPct,
          alerts: alerts.map((a) => ({
            keyword: a.keyword,
            total: a.total,
            neg_pct: a.negPct,
            severity: a.severity,
          })),
          top_keyword: topKeywords.map((k) => `${k.name}(${k.count})`),
          breaking_news: breaking.slice(0, 5).map((b) => ({
            judul: b.title,
            sumber: b.source,
          })),
        }}
      />
    </PageShell>
  );
}

function SentimentBar({
  label,
  value,
  count,
  color,
}: {
  label: string;
  value: number;
  count: number;
  color: "success" | "muted" | "destructive";
}) {
  const bg =
    color === "success"
      ? "bg-success"
      : color === "destructive"
        ? "bg-destructive"
        : "bg-muted-foreground/60";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {value}% · {count}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${bg}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
