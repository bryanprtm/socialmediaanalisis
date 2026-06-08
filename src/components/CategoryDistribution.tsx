import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon, AlertTriangle, TrendingUp } from "lucide-react";
import { Panel, Pill } from "@/components/PageShell";
import type { Article } from "@/hooks/use-filtered-articles";
import { useArticleDialog } from "@/components/ArticleDialog";

const PALETTE = [
  "oklch(0.78 0.18 195)",
  "oklch(0.65 0.22 295)",
  "oklch(0.78 0.2 150)",
  "oklch(0.82 0.18 80)",
  "oklch(0.7 0.25 330)",
  "oklch(0.65 0.24 22)",
  "oklch(0.7 0.18 220)",
  "oklch(0.75 0.15 110)",
  "oklch(0.6 0.2 260)",
  "oklch(0.65 0.02 240)",
];

function dayBucket(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function CategoryDistribution({
  articles,
  title = "Distribusi Kategori",
  className,
  maxRows = 10,
}: {
  articles: Article[];
  title?: string;
  className?: string;
  maxRows?: number;
}) {
  const dialog = useArticleDialog();
  const { rows, total, growth, byCat } = useMemo(() => {
    const total = articles.length;
    const map = new Map<string, Article[]>();
    for (const a of articles) {
      const c = a.category?.trim() || "Lainnya";
      const arr = map.get(c) ?? [];
      arr.push(a);
      map.set(c, arr);
    }

    // Today vs Yesterday for growth
    const today = dayBucket(new Date());
    const yesterday = today - 86400000;

    const rows = [...map.entries()]
      .map(([name, items]) => {
        const count = items.length;
        const pos = items.filter((a) => a.sentiment === "positive").length;
        const neg = items.filter((a) => a.sentiment === "negative").length;
        const neu = items.filter((a) => a.sentiment === "neutral").length;
        const pct = total ? Math.round((count / total) * 1000) / 10 : 0;
        const todayCount = items.filter(
          (a) => a.published_at && dayBucket(new Date(a.published_at)) === today,
        ).length;
        const yCount = items.filter(
          (a) => a.published_at && dayBucket(new Date(a.published_at)) === yesterday,
        ).length;
        const growthPct =
          yCount === 0 ? (todayCount > 0 ? 100 : 0) : Math.round(((todayCount - yCount) / yCount) * 100);
        const pctOf = (n: number) => (count ? Math.round((n / count) * 100) : 0);
        return {
          name,
          count,
          pct,
          pos,
          neg,
          neu,
          posPct: pctOf(pos),
          negPct: pctOf(neg),
          neuPct: pctOf(neu),
          todayCount,
          yCount,
          growthPct,
        };
      })
      .sort((a, b) => b.count - a.count);

    const growth = rows
      .filter((r) => r.growthPct >= 50 && r.todayCount >= 3)
      .slice(0, 3);

    return { rows: rows.slice(0, maxRows), total, growth, byCat: map };
  }, [articles, maxRows]);

  const openCat = (name: string) =>
    dialog.open({
      title: `Kategori: ${name}`,
      subtitle: "Klik judul untuk membuka berita",
      articles: byCat.get(name) ?? [],
    });

  if (total === 0) {
    return (
      <Panel className={className} title={title} icon={<PieIcon className="h-4 w-4" />}>
        <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data kategori.</p>
      </Panel>
    );
  }

  const chartData = rows.map((r, i) => ({ name: r.name, value: r.count, color: PALETTE[i % PALETTE.length] }));

  return (
    <Panel
      className={className}
      title={title}
      icon={<PieIcon className="h-4 w-4" />}
      action={<Pill tone="info">{rows.length} kategori</Pill>}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        {/* Donut */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                stroke="oklch(0.18 0.03 252)"
              >
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.03 252)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v, n) => {
                  const num = typeof v === "number" ? v : Number(v) || 0;
                  return [`${num} artikel (${((num / total) * 100).toFixed(1)}%)`, String(n)];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, color: "oklch(0.7 0.025 240)" }}
                iconType="circle"
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="max-h-64 overflow-y-auto pr-1">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-panel">
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3">Kategori</th>
                <th className="pb-2 pr-3 text-right">Jumlah</th>
                <th className="pb-2 pr-3 text-right">%</th>
                <th className="pb-2 pr-3">Sentimen</th>
                <th className="pb-2 pr-3 text-right">Δ 24h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr key={r.name} className="hover:bg-panel-elevated/60">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: PALETTE[i % PALETTE.length] }}
                      />
                      <span className="font-semibold text-foreground">{r.name}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-foreground">{r.count}</td>
                  <td className="py-2 pr-3 text-right font-mono text-muted-foreground">{r.pct}%</td>
                  <td className="py-2 pr-3">
                    <div className="flex h-1.5 w-28 overflow-hidden rounded-full">
                      <div className="bg-success" style={{ width: `${r.posPct}%` }} />
                      <div className="bg-muted-foreground/40" style={{ width: `${r.neuPct}%` }} />
                      <div className="bg-destructive" style={{ width: `${r.negPct}%` }} />
                    </div>
                    <div className="mt-0.5 flex w-28 justify-between font-mono text-[9px] text-muted-foreground">
                      <span className="text-success">+{r.posPct}</span>
                      <span>{r.neuPct}</span>
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
      </div>

      {/* Early warning */}
      {growth.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber/30 bg-amber/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber">
            <AlertTriangle className="h-3.5 w-3.5" /> Early Warning — Kategori Naik Tajam (24 jam)
          </div>
          <ul className="space-y-1.5">
            {growth.map((g) => (
              <li key={g.name} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{g.name}</span>
                <span className="flex items-center gap-2 font-mono text-amber">
                  <TrendingUp className="h-3 w-3" />+{g.growthPct}%
                  <span className="text-muted-foreground">
                    ({g.yCount} → {g.todayCount})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Total {total} artikel · {rows.length} kategori ditampilkan
      </p>
    </Panel>
  );
}
