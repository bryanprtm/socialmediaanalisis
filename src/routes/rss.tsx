import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill, Bar } from "@/components/PageShell";
import { Rss, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Tag, Globe, Activity } from "lucide-react";

export const Route = createFileRoute("/rss")({
  head: () => ({
    meta: [
      { title: "Keyword & RSS Manager — PROPAM" },
      { name: "description", content: "Kelola RSS feed dan keyword monitoring untuk berbagai sumber media." },
    ],
  }),
  component: Page,
});

const feeds = [
  { name: "Kompas.com — Politik", url: "https://kompas.com/rss/politik", status: "active" as const, last: "30s lalu", count: 247, freq: 95 },
  { name: "Detik.com — Ekonomi", url: "https://detik.com/rss/ekonomi", status: "active" as const, last: "1m lalu", count: 189, freq: 88 },
  { name: "CNN Indonesia — Nasional", url: "https://cnnindonesia.com/rss/nasional", status: "active" as const, last: "2m lalu", count: 156, freq: 91 },
  { name: "Tempo.co — Hukum", url: "https://tempo.co/rss/hukum", status: "warning" as const, last: "12m lalu", count: 87, freq: 64 },
  { name: "Antara News — Daerah", url: "https://antaranews.com/rss/daerah", status: "error" as const, last: "2h lalu", count: 0, freq: 0 },
  { name: "Republika — Internasional", url: "https://republika.co.id/rss/internasional", status: "active" as const, last: "45s lalu", count: 124, freq: 82 },
];

const keywords = [
  { name: "kebijakan ekonomi", count: 1247, alert: true, tone: "positive" as const, ch: "+12%" },
  { name: "subsidi BBM", count: 986, alert: true, tone: "negative" as const, ch: "+34%" },
  { name: "vaksin nasional", count: 745, alert: false, tone: "positive" as const, ch: "+8%" },
  { name: "IKN Nusantara", count: 623, alert: true, tone: "neutral" as const, ch: "-5%" },
  { name: "BPJS Kesehatan", count: 567, alert: false, tone: "positive" as const, ch: "+15%" },
  { name: "pemilu 2024", count: 1834, alert: true, tone: "neutral" as const, ch: "+45%" },
  { name: "blockchain", count: 234, alert: false, tone: "positive" as const, ch: "+22%" },
  { name: "inflasi", count: 892, alert: true, tone: "negative" as const, ch: "+18%" },
];

function Page() {
  return (
    <PageShell
      eyebrow="Data Pipeline"
      title="Keyword & RSS Manager"
      description="Kelola sumber RSS feed dan keyword monitoring — kontrol penuh atas pipeline data masuk."
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh All
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-4 py-2 text-xs font-semibold text-background">
            <Plus className="h-3.5 w-3.5" /> Add Feed
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total RSS Feed" value="42" delta="+3 baru" deltaTone="up" icon={<Rss className="h-5 w-5" />} accent="cyan" hint="6 ditampilkan" />
        <MetricCard label="Feed Aktif" value="38" delta="90.5%" deltaTone="up" icon={<CheckCircle2 className="h-5 w-5" />} accent="success" hint="Healthy status" />
        <MetricCard label="Keyword Tracked" value="156" delta="+12" deltaTone="up" icon={<Tag className="h-5 w-5" />} accent="violet" hint="8 ditampilkan" />
        <MetricCard label="Alerts Triggered" value="24" delta="last 24h" icon={<AlertCircle className="h-5 w-5" />} accent="amber" hint="6 unacknowledged" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="RSS Feed Sources"
          icon={<Rss className="h-4 w-4" />}
          action={<Pill tone="positive">38/42 Online</Pill>}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Source</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Last Sync</th>
                  <th className="px-2 py-2 font-medium">Articles 24h</th>
                  <th className="px-2 py-2 font-medium">Health</th>
                  <th className="px-2 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {feeds.map((f) => (
                  <tr key={f.url} className="text-sm hover:bg-panel-elevated">
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2 w-2 rounded-full ${f.status === "active" ? "bg-success animate-pulse-dot" : f.status === "warning" ? "bg-warning" : "bg-destructive"}`} />
                        <div>
                          <p className="font-semibold text-foreground">{f.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{f.url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Pill tone={f.status === "active" ? "positive" : f.status === "warning" ? "warning" : "negative"}>
                        {f.status}
                      </Pill>
                    </td>
                    <td className="px-2 py-3 font-mono text-xs text-muted-foreground">{f.last}</td>
                    <td className="px-2 py-3 font-mono text-sm font-semibold text-foreground">{f.count}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${f.freq >= 80 ? "bg-success" : f.freq >= 50 ? "bg-warning" : "bg-destructive"}`}
                            style={{ width: `${f.freq}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">{f.freq}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" aria-label="refresh">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Panel className="mt-4 bg-panel-elevated" title="Add New RSS Feed">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                placeholder="Feed Name (e.g. Liputan6 — Politik)"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
              />
              <input
                type="url"
                placeholder="https://example.com/rss/feed.xml"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
              />
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-4 text-xs font-semibold text-background">
                <Plus className="h-3.5 w-3.5" /> Add Feed
              </button>
            </div>
          </Panel>
        </Panel>

        <div className="space-y-5">
          <Panel title="Keyword Tracker" icon={<Tag className="h-4 w-4" />} action={<button className="rounded-md p-1.5 text-muted-foreground hover:text-primary"><Plus className="h-4 w-4" /></button>}>
            <div className="space-y-2">
              {keywords.map((k) => (
                <div key={k.name} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-foreground">#{k.name}</p>
                      {k.alert && <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-warning" />}
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground">{k.count.toLocaleString()} mentions</p>
                  </div>
                  <Pill tone={k.tone}>{k.ch}</Pill>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input type="text" placeholder="Add keyword…" className="h-9 flex-1 rounded-lg border border-border bg-panel-elevated px-3 text-xs text-foreground focus:border-primary/60 focus:outline-none" />
              <button className="rounded-lg bg-gradient-cyan px-3 text-xs font-semibold text-background"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          </Panel>

          <Panel title="Pipeline Health" icon={<Activity className="h-4 w-4" />}>
            <div className="space-y-4">
              <Bar label="Ingestion Rate" value={92} color="primary" />
              <Bar label="Parser Success" value={97} color="success" />
              <Bar label="AI Sentiment" value={88} color="violet" />
              <Bar label="Storage" value={71} color="warning" />
            </div>
            <div className="mt-4 rounded-lg border border-border bg-panel-elevated p-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">2,847 articles ingested today</p>
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">Avg latency: 1.2s · Error rate: 0.3%</p>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
