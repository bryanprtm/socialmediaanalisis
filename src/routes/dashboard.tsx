import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Bar, Pill } from "@/components/PageShell";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Newspaper, Globe, MessageCircle, Bell, RefreshCw, Filter, MoreHorizontal, ChevronRight, TrendingUp, Plus, Download, BarChart3, Activity, Eye } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Analytics — PROPAM Command Center" },
      { name: "description", content: "Real-time monitoring dashboard dengan metrik komprehensif dan insight." },
    ],
  }),
  component: DashboardPage,
});

const timelineData = [
  { time: "08:00", positif: 65, negatif: 20, netral: 15 },
  { time: "09:00", positif: 58, negatif: 25, netral: 17 },
  { time: "10:00", positif: 72, negatif: 18, netral: 10 },
  { time: "11:00", positif: 68, negatif: 22, netral: 10 },
  { time: "12:00", positif: 75, negatif: 15, netral: 10 },
  { time: "13:00", positif: 70, negatif: 20, netral: 10 },
  { time: "14:00", positif: 78, negatif: 14, netral: 8 },
];

const articles = [
  {
    n: "01",
    title: "Perkembangan Politik Terkini di Jakarta",
    desc: "Analisis mendalam tentang situasi politik yang berkembang di Jakarta dengan fokus pada kebijakan publik dan dampaknya terhadap masyarakat.",
    cats: ["Politik", "Jakarta", "Kebijakan"],
    sent: ["Netral", "Analitis"],
    badge: "BARU",
    badgeTone: "info" as const,
    time: "2 menit yang lalu",
    views: "1.2k",
  },
  {
    n: "02",
    title: "Ekonomi Indonesia Menunjukkan Tren Positif",
    desc: "Data terbaru menunjukkan pertumbuhan ekonomi yang stabil dengan indikator positif di berbagai sektor industri dan perdagangan.",
    cats: ["Ekonomi", "Pertumbuhan", "Industri"],
    sent: ["Positif", "Optimis"],
    badge: "UPDATE",
    badgeTone: "warning" as const,
    time: "15 menit yang lalu",
    views: "856",
  },
  {
    n: "03",
    title: "Inovasi Teknologi dalam Pendidikan",
    desc: "Implementasi teknologi terdepan dalam sistem pendidikan nasional membawa perubahan signifikan dalam metode pembelajaran.",
    cats: ["Teknologi", "Pendidikan", "Inovasi"],
    sent: ["Positif", "Progresif"],
    badge: "ARSIP",
    badgeTone: "neutral" as const,
    time: "1 jam yang lalu",
    views: "642",
  },
];

const portals = [
  { name: "Kompas.com", count: "1,247", perf: 95, status: "online" as const, trend: "up" as const, color: "success" as const },
  { name: "Detik.com", count: "986", perf: 88, status: "online" as const, trend: "up" as const, color: "primary" as const },
  { name: "CNN Indonesia", count: "654", perf: 91, status: "online" as const, trend: "neutral" as const, color: "primary" as const },
  { name: "Tempo.co", count: "423", perf: 72, status: "maintenance" as const, trend: "down" as const, color: "warning" as const },
];

const keywords = [
  { name: "Politik", count: 1240, change: "+12%", tone: "positive" as const },
  { name: "Ekonomi", count: 986, change: "+8%", tone: "positive" as const },
  { name: "Sosial", count: 745, change: "-5%", tone: "negative" as const },
  { name: "Teknologi", count: 623, change: "+15%", tone: "positive" as const },
  { name: "Kesehatan", count: 567, change: "+3%", tone: "positive" as const },
];

function DashboardPage() {
  return (
    <PageShell
      eyebrow="Realtime Telemetry"
      title="Dashboard Analytics"
      description="Real-time monitoring & insights — pantau seluruh pulse media Indonesia di satu pusat kendali."
      actions={
        <>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-panel p-1">
            <button className="rounded-md bg-primary/15 px-3 py-1 font-mono text-xs font-semibold text-primary">24h</button>
            <button className="rounded-md px-3 py-1 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground">30d</button>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button className="rounded-lg border border-border bg-panel p-2 text-muted-foreground hover:text-foreground" aria-label="alerts">
            <Bell className="h-4 w-4" />
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Berita Terpantau" value="2,847" delta="+12.5%" deltaTone="up" icon={<Newspaper className="h-5 w-5" />} accent="cyan" hint="Last update 2m ago" />
        <MetricCard label="Portal Aktif" value="24" delta="+3 baru" deltaTone="up" icon={<Globe className="h-5 w-5" />} accent="success" hint="92% uptime" />
        <MetricCard label="Sentiment Positif" value="68.3%" delta="+5.2%" deltaTone="up" icon={<MessageCircle className="h-5 w-5" />} accent="violet" hint="Trending up" />
        <MetricCard label="Alert Teraktivasi" value="12" delta="-2 turun" deltaTone="down" icon={<Bell className="h-5 w-5" />} accent="amber" hint="45% acknowledged" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Berita Terkini"
          icon={<Newspaper className="h-4 w-4" />}
          action={
            <div className="flex gap-1">
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Filter className="h-4 w-4" /></button>
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
          }
        >
          <ul className="space-y-3">
            {articles.map((a) => (
              <li key={a.n} className="group rounded-xl border border-border bg-panel-elevated p-4 transition-colors hover:border-primary/30">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-primary">{a.n}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-foreground">{a.title}</h3>
                      <Pill tone={a.badgeTone}>{a.badge}</Pill>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{a.desc}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Kategori</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {a.cats.map((c) => <Pill key={c} tone="info">{c}</Pill>)}
                        </div>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sentiment</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {a.sent.map((c) => <Pill key={c} tone="positive">{c}</Pill>)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                      <span className="font-mono">⏱ {a.time} · 👁 {a.views}</span>
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-primary hover:underline">
            Lihat Semua Berita <ChevronRight className="h-3 w-3" />
          </button>
        </Panel>

        <div className="space-y-5">
          <Panel title="Portal Berita" icon={<Globe className="h-4 w-4" />}>
            <ul className="space-y-3">
              {portals.map((p) => (
                <li key={p.name} className="rounded-lg border border-border bg-panel-elevated p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{p.name}</span>
                    <Pill tone={p.status === "online" ? "positive" : "warning"}>{p.status}</Pill>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Artikel</span>
                    <span className="font-mono font-bold text-foreground">{p.count}</span>
                  </div>
                  <div className="mt-2">
                    <Bar label="Performance" value={p.perf} color={p.color} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Quick Actions">
            <div className="space-y-2">
              <button className="flex w-full items-center gap-2 rounded-lg bg-gradient-cyan px-4 py-2.5 text-sm font-semibold text-background shadow-[0_0_24px_-8px_oklch(0.78_0.18_195_/_0.7)]">
                <Plus className="h-4 w-4" /> Tambah Portal Baru
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-panel-elevated px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40">
                <BarChart3 className="h-4 w-4" /> Analisis Mendalam
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-panel-elevated px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40">
                <Download className="h-4 w-4" /> Export Data
              </button>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel
          title="Sentiment Timeline"
          icon={<Activity className="h-4 w-4" />}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-success">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" /> Live
            </span>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="g-pos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.2 150)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.78 0.2 150)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-neg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.24 22)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.65 0.24 22)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="time" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="positif" stroke="oklch(0.78 0.2 150)" fill="url(#g-pos)" strokeWidth={2} />
                <Area type="monotone" dataKey="negatif" stroke="oklch(0.65 0.24 22)" fill="url(#g-neg)" strokeWidth={2} />
                <Area type="monotone" dataKey="netral" stroke="oklch(0.65 0.02 240)" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Trending Keywords" icon={<TrendingUp className="h-4 w-4" />} action={<button className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"><RefreshCw className="h-4 w-4" /></button>}>
          <ul className="space-y-3">
            {keywords.map((k) => (
              <li key={k.name} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{k.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{k.count.toLocaleString()} mentions</p>
                </div>
                <Pill tone={k.tone}>{k.change}</Pill>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
