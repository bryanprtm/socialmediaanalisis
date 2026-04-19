import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Bar, Pill } from "@/components/PageShell";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Search, TrendingUp, Hash, Filter, Bell, RefreshCw, Flame, Sparkles, Activity, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trends & Topics — PROPAM Command Center" },
      { name: "description", content: "Analisis trending topics dan evolusi perbincangan publik secara real-time." },
    ],
  }),
  component: TrendsPage,
});

const evolution = [
  { t: "00:00", ekonomi: 130, infra: 110, kesehatan: 95, vokasi: 80 },
  { t: "04:00", ekonomi: 160, infra: 140, kesehatan: 120, vokasi: 100 },
  { t: "08:00", ekonomi: 220, infra: 200, kesehatan: 180, vokasi: 150 },
  { t: "12:00", ekonomi: 270, infra: 250, kesehatan: 230, vokasi: 200 },
  { t: "16:00", ekonomi: 290, infra: 270, kesehatan: 240, vokasi: 220 },
  { t: "20:00", ekonomi: 250, infra: 240, kesehatan: 200, vokasi: 180 },
];

const trending = [
  { rank: 1, name: "Kebijakan Ekonomi", mentions: 2847, change: "+15.3%", tone: "warning" as const, time: "14:30", tags: ["#KebijakanFiskal", "#KenaikanInflasi"] },
  { rank: 2, name: "Infrastruktur Digital", mentions: 1923, change: "+28.7%", tone: "positive" as const, time: "13:15", tags: ["#DigitalIndonesia", "#Infrastruktur"] },
  { rank: 3, name: "Program Kesehatan", mentions: 1654, change: "-8.2%", tone: "negative" as const, time: "11:45", tags: ["#KesehatanPublik", "#BPJS"] },
  { rank: 4, name: "Pendidikan Vokasi", mentions: 1432, change: "+34.1%", tone: "positive" as const, time: "12:20", tags: ["#PendidikanVokasi", "#SDM"] },
  { rank: 5, name: "Energi Terbarukan", mentions: 1287, change: "+12.8%", tone: "positive" as const, time: "10:00", tags: ["#EnergiTerbarukan", "#GreenEnergy"] },
];

const emerging = [
  { name: "AI Governance", mentions: 736, growth: "+156.7%", color: "amber" as const },
  { name: "Smart Mobility", mentions: 489, growth: "+134.2%", color: "violet" as const },
  { name: "Startup Fintech", mentions: 367, growth: "+89.5%", color: "success" as const },
  { name: "Perlindungan Digital", mentions: 245, growth: "+67.8%", color: "primary" as const },
];

function TrendsPage() {
  return (
    <PageShell
      eyebrow="Real-time Pulse"
      title="Trends & Topics Analysis"
      description="Analisis mendalam trending topics dan evolusi perbincangan publik di Indonesia."
      actions={
        <>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground">
            <option>24 Jam</option><option>7 Hari</option><option>30 Hari</option>
          </select>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground">
            <option>Semua Kategori</option><option>Politik</option><option>Ekonomi</option>
          </select>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-4 py-2 text-xs font-semibold text-background shadow-[0_0_24px_-8px_oklch(0.78_0.18_195_/_0.7)]">
            <RefreshCw className="h-3.5 w-3.5" /> Auto Refresh
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Cari topik atau kata kunci…"
            className="w-full rounded-lg border border-border bg-panel py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <select className="rounded-lg border border-border bg-panel px-4 py-2.5 text-sm text-foreground"><option>Overview</option></select>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40">
          <Filter className="h-4 w-4" /> Filter Lanjutan
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40">
          <Bell className="h-4 w-4" /> Set Alert
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Topik Trending Hari Ini" icon={<Flame className="h-4 w-4" />}>
          <ul className="space-y-3">
            {trending.map((t) => (
              <li key={t.rank} className="rounded-lg border border-border bg-panel-elevated p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-primary">#{t.rank}</p>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  </div>
                  <Pill tone={t.tone}>{t.change}</Pill>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Mentions</p>
                    <p className="font-mono font-bold text-foreground">{t.mentions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Peak</p>
                    <p className="font-mono font-bold text-foreground">{t.time}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.tags.map((g) => <Pill key={g} tone="info">{g}</Pill>)}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="lg:col-span-2" title="Evolusi Topik (24 Jam)" icon={<Activity className="h-4 w-4" />} action={
          <div className="flex gap-1">
            <button className="rounded-md bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-semibold text-primary">Live</button>
            <button className="rounded-md px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground hover:text-foreground">Export</button>
          </div>
        }>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="t" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="ekonomi" stroke="oklch(0.78 0.18 195)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="infra" stroke="oklch(0.65 0.22 295)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="kesehatan" stroke="oklch(0.78 0.2 150)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="vokasi" stroke="oklch(0.82 0.18 80)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat l="Pertumbuhan Avg" v="+12%" tone="text-success" />
            <Stat l="Peak Duration" v="2.4h" tone="text-cyan" />
            <Stat l="Total Mentions" v="847" tone="text-violet" />
            <Stat l="Volatility Index" v="68%" tone="text-amber" />
          </div>
        </Panel>
      </div>

      <Panel className="mt-6" title="Topik Emerging" icon={<Sparkles className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {emerging.map((e) => (
            <div key={e.name} className="rounded-lg border border-border bg-panel-elevated p-4">
              <p className="text-sm font-semibold text-foreground">{e.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{e.mentions} mentions</p>
              <div className="mt-3 flex items-end justify-between">
                <Bar label="growth" value={Math.min(100, parseInt(e.growth))} color={e.color} unit="" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="mt-6 bg-gradient-violet" title="Cloud Kata Populer" icon={<Hash className="h-4 w-4" />}>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="relative grid h-64 place-items-center overflow-hidden rounded-xl bg-black/30 grid-bg">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 p-6 text-center">
              <span className="font-display text-4xl font-bold text-cyan">Kebijakan</span>
              <span className="font-display text-3xl font-bold text-violet">Digital</span>
              <span className="font-display text-5xl font-bold text-amber">Infrastruktur</span>
              <span className="font-display text-3xl font-bold text-success">Ekonomi</span>
              <span className="font-display text-2xl font-bold text-magenta">Pembangunan</span>
              <span className="font-display text-xl font-bold text-rose">Teknologi</span>
              <span className="font-display text-2xl font-bold text-cyan">Inovasi</span>
              <span className="font-display text-3xl font-bold text-violet">Transformasi</span>
              <span className="font-display text-xl font-bold text-amber">Modernisasi</span>
              <span className="font-display text-lg font-bold text-success">Efisiensi</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat l="Total Keywords" v="15,106" tone="text-cyan" big />
            <Stat l="Total Mentions" v="68%" tone="text-amber" big />
            <Stat l="Validity Index" v="847" tone="text-success" big />
            <Stat l="Velocity" v="+24%" tone="text-magenta" big />
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}

function Stat({ l, v, tone, big }: { l: string; v: string; tone: string; big?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-panel-elevated p-3 text-center">
      <p className={`font-display ${big ? "text-2xl" : "text-lg"} font-bold ${tone}`}>{v}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l}</p>
    </div>
  );
}
