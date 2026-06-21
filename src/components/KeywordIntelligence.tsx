import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar as RBar,
} from "recharts";
import {
  Hash,
  Flame,
  AlertTriangle,
  Sparkles,
  Cloud,
  Clock,
  MapPin,
  Newspaper,
  Link2,
  TrendingUp,
} from "lucide-react";
import { Panel, Pill } from "@/components/PageShell";
import type { Article } from "@/hooks/use-filtered-articles";
import { useArticleDialog } from "@/components/ArticleDialog";
import { AIPanelInsight } from "@/components/AIPanelInsight";

const PALETTE = [
  "oklch(0.78 0.18 195)",
  "oklch(0.65 0.22 295)",
  "oklch(0.78 0.2 150)",
  "oklch(0.82 0.18 80)",
  "oklch(0.7 0.25 330)",
  "oklch(0.65 0.24 22)",
  "oklch(0.7 0.18 220)",
  "oklch(0.75 0.15 110)",
];

const SENSITIVE = [
  "demo",
  "korupsi",
  "premanisme",
  "oknum",
  "pemecatan",
  "bentrok",
  "tawuran",
  "hoaks",
  "anarkis",
  "rusuh",
];

function dayBucket(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function normalizeKw(k: string) {
  return k.trim().toLowerCase();
}

type Row = {
  name: string;
  count: number;
  pct: number;
  pos: number;
  neg: number;
  neu: number;
  posPct: number;
  negPct: number;
  neuPct: number;
  todayCount: number;
  yCount: number;
  growthPct: number;
  topSource: string | null;
  topRegion: string | null;
  firstSeen: number | null;
};

export function KeywordIntelligence({
  articles,
  className,
}: {
  articles: Article[];
  className?: string;
}) {
  const [limit, setLimit] = useState<10 | 20 | 50>(10);
  const [focus, setFocus] = useState<string | null>(null);
  const dialog = useArticleDialog();

  const data = useMemo(() => {
    const today = dayBucket(new Date());
    const yesterday = today - 86400000;
    const map = new Map<string, Article[]>();
    for (const a of articles) {
      const seen = new Set<string>();
      for (const raw of a.keywords ?? []) {
        const k = normalizeKw(raw);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        const arr = map.get(k) ?? [];
        arr.push(a);
        map.set(k, arr);
      }
    }
    const totalMentions = [...map.values()].reduce((s, v) => s + v.length, 0);

    const allRows: Row[] = [...map.entries()].map(([name, items]) => {
      const count = items.length;
      const pos = items.filter((a) => a.sentiment === "positive").length;
      const neg = items.filter((a) => a.sentiment === "negative").length;
      const neu = items.filter((a) => a.sentiment === "neutral").length;
      const pctOf = (n: number) => (count ? Math.round((n / count) * 100) : 0);
      const todayCount = items.filter(
        (a) => a.published_at && dayBucket(new Date(a.published_at)) === today,
      ).length;
      const yCount = items.filter(
        (a) => a.published_at && dayBucket(new Date(a.published_at)) === yesterday,
      ).length;
      const growthPct =
        yCount === 0
          ? todayCount > 0
            ? 100
            : 0
          : Math.round(((todayCount - yCount) / yCount) * 100);
      const srcMap = new Map<string, number>();
      const regMap = new Map<string, number>();
      let firstSeen: number | null = null;
      for (const a of items) {
        srcMap.set(a.source, (srcMap.get(a.source) ?? 0) + 1);
        if (a.region) regMap.set(a.region, (regMap.get(a.region) ?? 0) + 1);
        if (a.published_at) {
          const t = new Date(a.published_at).getTime();
          if (firstSeen === null || t < firstSeen) firstSeen = t;
        }
      }
      const topSource = [...srcMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const topRegion = [...regMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        name,
        count,
        pct: totalMentions ? Math.round((count / totalMentions) * 1000) / 10 : 0,
        pos,
        neg,
        neu,
        posPct: pctOf(pos),
        negPct: pctOf(neg),
        neuPct: pctOf(neu),
        todayCount,
        yCount,
        growthPct,
        topSource,
        topRegion,
        firstSeen,
      };
    });
    allRows.sort((a, b) => b.count - a.count);

    const topRows = allRows.slice(0, limit);

    const trending = [...allRows]
      .filter((r) => r.todayCount >= 2 && r.growthPct > 0)
      .sort((a, b) => b.growthPct - a.growthPct)
      .slice(0, 8);

    const alerts = allRows.filter((r) =>
      SENSITIVE.some((s) => r.name.includes(s)),
    ).slice(0, 8);

    // Per-source top keyword
    const sourceTop = new Map<string, { kw: string; count: number }>();
    for (const r of allRows) {
      if (!r.topSource) continue;
      const cur = sourceTop.get(r.topSource);
      if (!cur || cur.count < r.count) sourceTop.set(r.topSource, { kw: r.name, count: r.count });
    }
    const perSource = [...sourceTop.entries()]
      .map(([source, v]) => ({ source, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Per-region top keyword
    const regionTop = new Map<string, { kw: string; count: number }>();
    for (const r of allRows) {
      if (!r.topRegion) continue;
      const cur = regionTop.get(r.topRegion);
      if (!cur || cur.count < r.count) regionTop.set(r.topRegion, { kw: r.name, count: r.count });
    }
    const perRegion = [...regionTop.entries()]
      .map(([region, v]) => ({ region, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { allRows, topRows, totalMentions, trending, alerts, perSource, perRegion, map };
  }, [articles, limit]);

  // Focus default
  const focusKw = focus ?? data.topRows[0]?.name ?? null;
  const focusItems = focusKw ? data.map.get(focusKw) ?? [] : [];

  const openKw = (kw: string) => {
    dialog.open({
      title: `Keyword: ${kw}`,
      subtitle: "Klik judul untuk membuka berita",
      articles: data.map.get(kw) ?? [],
    });
  };
  const openSource = (source: string) =>
    dialog.open({
      title: `Sumber: ${source}`,
      articles: articles.filter((a) => a.source === source),
    });
  const openRegion = (region: string) =>
    dialog.open({
      title: `Wilayah: ${region}`,
      articles: articles.filter((a) => a.region === region),
    });
  const openSentiment = (sent: "positive" | "neutral" | "negative") =>
    dialog.open({
      title: `Sentimen ${sent} · Keyword: ${focusKw ?? "-"}`,
      articles: focusItems.filter((a) => a.sentiment === sent),
    });

  // Hourly trend (24h) for focus keyword
  const hourly = useMemo(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const buckets: { t: string; v: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const start = now.getTime() - i * 3600000;
      const end = start + 3600000;
      const v = focusItems.filter((a) => {
        if (!a.published_at) return false;
        const t = new Date(a.published_at).getTime();
        return t >= start && t < end;
      }).length;
      buckets.push({ t: new Date(start).toLocaleTimeString("id-ID", { hour: "2-digit" }) + ":00", v });
    }
    return buckets;
  }, [focusItems]);

  // Related keywords: co-occurring in same article
  const related = useMemo(() => {
    if (!focusKw) return [] as { name: string; count: number }[];
    const m = new Map<string, number>();
    for (const a of focusItems) {
      for (const raw of a.keywords ?? []) {
        const k = normalizeKw(raw);
        if (!k || k === focusKw) continue;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [focusItems, focusKw]);

  const maxCount = data.topRows[0]?.count ?? 1;
  const minSize = 11;
  const maxSize = 32;

  if (data.totalMentions === 0) {
    return (
      <Panel className={className} title="Keyword Intelligence" icon={<Hash className="h-4 w-4" />}>
        <p className="py-10 text-center text-sm text-muted-foreground">Belum ada keyword terindeks.</p>
      </Panel>
    );
  }

  return (
    <div className={`space-y-5 ${className ?? ""}`}>
      {/* Keyword Teratas */}
      <Panel
        title="Keyword Teratas"
        icon={<Hash className="h-4 w-4" />}
        action={
          <div className="flex items-center gap-1.5">
            {([10, 20, 50] as const).map((n) => (
              <button
                key={n}
                onClick={() => setLimit(n)}
                className={`rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                  limit === n
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-panel-elevated text-muted-foreground hover:border-primary/40"
                }`}
              >
                Top {n}
              </button>
            ))}
          </div>
        }
      >
        <div className="max-h-[420px] overflow-y-auto pr-1">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-panel">
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Keyword</th>
                <th className="pb-2 pr-3 text-right">Mention</th>
                <th className="pb-2 pr-3 text-right">%</th>
                <th className="pb-2 pr-3">Sentimen</th>
                <th className="pb-2 pr-3 text-right">Δ 24h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.topRows.map((r, i) => (
                <tr
                  key={r.name}
                  className={`cursor-pointer hover:bg-panel-elevated/60 ${focusKw === r.name ? "bg-panel-elevated/40" : ""}`}
                  onClick={() => { setFocus(r.name); openKw(r.name); }}
                >
                  <td className="py-2 pr-3 font-mono text-xs text-primary">{i + 1}</td>
                  <td className="py-2 pr-3 font-semibold text-foreground">{r.name}</td>
                  <td className="py-2 pr-3 text-right font-mono text-foreground">{r.count}</td>
                  <td className="py-2 pr-3 text-right font-mono text-muted-foreground">{r.pct}%</td>
                  <td className="py-2 pr-3">
                    <div className="flex h-1.5 w-28 overflow-hidden rounded-full">
                      <div className="bg-success" style={{ width: `${r.posPct}%` }} />
                      <div className="bg-muted-foreground/40" style={{ width: `${r.neuPct}%` }} />
                      <div className="bg-destructive" style={{ width: `${r.negPct}%` }} />
                    </div>
                    <div className="mt-0.5 flex w-28 justify-between font-mono text-[9px]">
                      <span className="text-success">+{r.posPct}</span>
                      <span className="text-muted-foreground">{r.neuPct}</span>
                      <span className="text-destructive">-{r.negPct}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <span
                      className={`font-mono text-xs ${
                        r.growthPct > 0
                          ? "text-success"
                          : r.growthPct < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {r.growthPct > 0 ? "▲" : r.growthPct < 0 ? "▼" : "■"} {Math.abs(r.growthPct)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AIPanelInsight
          panel="Keyword Intelligence — Keyword Teratas"
          data={{
            total_mention: data.totalMentions,
            top_keywords: data.topRows.slice(0, 15).map((r) => ({
              keyword: r.name,
              mention: r.count,
              persen: r.pct,
              positif_pct: r.posPct,
              negatif_pct: r.negPct,
              netral_pct: r.neuPct,
              delta_24h_pct: r.growthPct,
            })),
          }}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Word cloud */}
        <Panel title="Word Cloud" icon={<Cloud className="h-4 w-4" />}>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4">
            {data.topRows.map((r, i) => {
              const size = minSize + ((r.count / maxCount) * (maxSize - minSize));
              const color = PALETTE[i % PALETTE.length];
              return (
                <button
                  key={r.name}
                  onClick={() => { setFocus(r.name); openKw(r.name); }}
                  className="font-display font-bold leading-tight transition hover:opacity-100"
                  style={{
                    fontSize: `${size}px`,
                    color,
                    opacity: 0.55 + 0.45 * (r.count / maxCount),
                  }}
                  title={`${r.count} mention`}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Trending */}
        <Panel title="Trending Keyword (24 jam)" icon={<Flame className="h-4 w-4" />}>
          {data.trending.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Belum ada keyword yang naik signifikan.</p>
          ) : (
            <ul className="space-y-2">
              {data.trending.map((r) => (
                <li
                  key={r.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel-elevated p-2.5"
                >
                  <button
                    onClick={() => { setFocus(r.name); openKw(r.name); }}
                    className="min-w-0 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {r.todayCount} hari ini · {r.yCount} kemarin
                    </p>
                  </button>
                  <Pill tone={r.growthPct >= 100 ? "warning" : "info"}>
                    <TrendingUp className="mr-1 inline h-3 w-3" />+{r.growthPct}%
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Per-source */}
        <Panel title="Keyword Teratas per Sumber" icon={<Newspaper className="h-4 w-4" />}>
          {data.perSource.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Belum ada data sumber.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.perSource.map((s) => (
                <li
                  key={s.source}
                  onClick={() => openSource(s.source)}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-panel-elevated px-3 py-2 text-sm hover:border-primary/40"
                >
                  <span className="truncate font-mono text-[11px] text-muted-foreground">{s.source}</span>
                  <span className="ml-3 truncate font-semibold text-foreground">{s.kw}</span>
                  <Pill tone="info">{s.count}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Per-region */}
        <Panel title="Keyword Teratas per Wilayah" icon={<MapPin className="h-4 w-4" />}>
          {data.perRegion.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Belum ada data wilayah.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.perRegion.map((s) => (
                <li
                  key={s.region}
                  onClick={() => openRegion(s.region)}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-panel-elevated px-3 py-2 text-sm hover:border-primary/40"
                >
                  <span className="truncate font-mono text-[11px] text-muted-foreground">{s.region}</span>
                  <span className="ml-3 truncate font-semibold text-foreground">{s.kw}</span>
                  <Pill tone="info">{s.count}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Detail keyword focus: hourly + related + sentimen */}
      {focusKw && (
        <Panel
          title={
            <span>
              Detail Keyword: <span className="text-primary">{focusKw}</span>
            </span>
          }
          icon={<Sparkles className="h-4 w-4" />}
          action={<Pill tone="info">{focusItems.length} artikel</Pill>}
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
            <div>
              <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3" /> Kemunculan per Jam (24 jam)
              </p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={hourly}
                    onClick={(e) => {
                      const label = e?.activeLabel != null ? String(e.activeLabel) : null;
                      if (!label || !focusKw) return;
                      const items = focusItems.filter((a) => {
                        if (!a.published_at) return false;
                        const hr = new Date(a.published_at).toLocaleTimeString("id-ID", { hour: "2-digit" }) + ":00";
                        return hr === label;
                      });
                      dialog.open({ title: `Keyword ${focusKw} · ${label}`, articles: items });
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                    <XAxis dataKey="t" stroke="oklch(0.7 0.025 240)" fontSize={10} interval={2} />
                    <YAxis stroke="oklch(0.7 0.025 240)" fontSize={10} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.03 252)",
                        border: "1px solid oklch(1 0 0 / 0.1)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="v" stroke="oklch(0.78 0.18 195)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-4 mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <Hash className="h-3 w-3" /> Sentimen
              </p>
              {(() => {
                const row = data.allRows.find((r) => r.name === focusKw);
                if (!row) return null;
                const sentData = [
                  { name: "Positif", value: row.posPct, fill: "oklch(0.78 0.2 150)" },
                  { name: "Netral", value: row.neuPct, fill: "oklch(0.65 0.02 240)" },
                  { name: "Negatif", value: row.negPct, fill: "oklch(0.65 0.24 22)" },
                ];
                return (
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sentData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                        <XAxis type="number" stroke="oklch(0.7 0.025 240)" fontSize={10} domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            background: "oklch(0.18 0.03 252)",
                            border: "1px solid oklch(1 0 0 / 0.1)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(v) => [`${v}%`, ""]}
                        />
                        <RBar
                          dataKey="value"
                          radius={[0, 4, 4, 0]}
                          onClick={(d: { name?: string }) => {
                            const m: Record<string, "positive" | "neutral" | "negative"> = {
                              Positif: "positive",
                              Netral: "neutral",
                              Negatif: "negative",
                            };
                            const s = d?.name ? m[d.name] : undefined;
                            if (s) openSentiment(s);
                          }}
                          style={{ cursor: "pointer" }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <Link2 className="h-3 w-3" /> Related Keywords
              </p>
              {related.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tidak ada keyword terkait.</p>
              ) : (
                <ul className="space-y-1.5">
                  {related.map((r) => (
                    <li
                      key={r.name}
                      className="flex items-center justify-between rounded-md border border-border bg-panel-elevated px-2.5 py-1.5"
                    >
                      <button
                        onClick={() => { setFocus(r.name); openKw(r.name); }}
                        className="truncate text-left text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {r.name}
                      </button>
                      <span className="font-mono text-[11px] text-muted-foreground">{r.count}×</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* Early warning */}
      {data.alerts.length > 0 && (
        <Panel
          title="Keyword Alert — Early Warning"
          icon={<AlertTriangle className="h-4 w-4 text-amber" />}
        >
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.alerts.map((r) => (
              <li
                key={r.name}
                onClick={() => openKw(r.name)}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 hover:bg-amber/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {r.count} mention · neg {r.negPct}%
                  </p>
                </div>
                <Pill tone={r.growthPct > 50 ? "warning" : "info"}>
                  {r.growthPct > 0 ? "+" : ""}
                  {r.growthPct}%
                </Pill>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Memantau kata sensitif: {SENSITIVE.join(", ")}
          </p>
        </Panel>
      )}
    </div>
  );
}
