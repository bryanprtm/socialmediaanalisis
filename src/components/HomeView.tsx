import { useState, useEffect } from "react";
import {
  Pause,
  Play,
  RefreshCw,
  BarChart3,
  Target,
  Globe,
  Zap,
  Search,
  Brain,
  TrendingUp,
  Network,
  MapPin,
  Download,
  Clock,
  ArrowRight,
  MessageSquare,
  Activity,
  Rss,
  GitCompare,
  Radio,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/propam-logo.png";
import { Panel, MetricCard, Bar, Pill } from "./PageShell";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";

type TabId = "fitur" | "aktivitas" | "quick";

const features = [
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Visualisasi data komprehensif dengan grafik interaktif dan metrik real-time", accent: "cyan", to: "/dashboard" },
  { icon: Search, title: "Search & Monitoring", desc: "Pencarian berita dan monitoring sentiment dengan filter advanced", accent: "success", to: "/search" },
  { icon: Brain, title: "Sentiment Analysis", desc: "Analisis sentiment mendalam dengan AI dan machine learning", accent: "violet", to: "/sentiment" },
  { icon: TrendingUp, title: "Trends & Topics", desc: "Analisis trending topics dan evolusi perbincangan publik", accent: "amber", to: "/trends" },
  { icon: Globe, title: "Media Analysis", desc: "Monitoring kredibilitas dan performa sumber media secara mendalam", accent: "magenta", to: "/media" },
  { icon: Network, title: "SNA Visualization", desc: "Visualisasi jaringan sosial dan analisis pola komunikasi interaktif", accent: "cyan", to: "/sna" },
  { icon: Activity, title: "Issue Prediction", desc: "Prediksi tren dan perubahan topik menggunakan machine learning dan AI", accent: "amber", to: "/prediction" },
  { icon: Rss, title: "Keyword & RSS Manager", desc: "Kelola kata kunci dan RSS feed untuk monitoring media yang optimal", accent: "danger", to: "/rss" },
  { icon: GitCompare, title: "Comparative Analysis", desc: "Bandingkan sentiment dan performa topik antar berbagai sumber media", accent: "violet", to: "/comparative" },
  { icon: Target, title: "Action Recommendations", desc: "Strategi dan rekomendasi berbasis AI untuk optimasi monitoring media", accent: "success", to: "/recommendations" },
  { icon: Download, title: "Export Report", desc: "Generate dan export laporan monitoring media dengan format WhatsApp", accent: "magenta", to: "/export" },
  { icon: MapPin, title: "Peta Indonesia", desc: "Distribusi geografis sentiment di seluruh nusantara", accent: "danger", to: "/map" },
] as const;


function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export function HomeView() {
  const [tab, setTab] = useState<TabId>("fitur");
  const [live, setLive] = useState(true);
  const t = useClock();
  const time = t.toLocaleTimeString("id-ID", { hour12: false });
  const date = t.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 scanline-bg" />
        <div className="absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="relative mx-auto max-w-[1440px] px-6 pb-16 pt-12 text-center">
          {/* status bar */}
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Radio className="h-3 w-3 animate-pulse-dot text-success" /> System Online
            </span>
            <span>{date}</span>
            <span className="text-primary">⏱ {time} WIB</span>
          </div>

          <div className="mt-8 flex items-center justify-center gap-5">
            <img
              src={logo}
              alt="PROPAM logo"
              width={88}
              height={88}
              className="h-20 w-20 drop-shadow-[0_0_24px_oklch(0.65_0.24_22_/_0.6)]"
            />
            <div className="text-left">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                MONITORING MEDIA
                <br />
                <span className="text-gradient-primary">TACTICAL OPERATION CENTER</span>
              </h1>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
                ▸ Sentiment Analysis · Media Intelligence · RSS Feed
              </p>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Platform monitoring berita & analisis sentiment berbasis AI untuk memahami opini publik
            dari berbagai sumber media di Indonesia secara <span className="font-semibold text-foreground">real-time melalui RSS Feed</span>.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setLive((v) => !v)}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary backdrop-blur transition-all hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_24px_-4px_oklch(0.78_0.18_195_/_0.6)]"
            >
              {live ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {live ? "Live Mode Active" : "Resume Live Mode"}
              <span className={`ml-1 inline-block h-2 w-2 rounded-full bg-success ${live ? "animate-pulse-dot" : "opacity-30"}`} />
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-cta px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-4px_oklch(0.65_0.22_295_/_0.6)] transition-transform hover:scale-[1.02]"
            >
              <BarChart3 className="h-4 w-4" /> Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-[1440px] px-6 pt-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Artikel Hari Ini"
            value="1,302"
            delta="+12.5% vs kemarin"
            deltaTone="up"
            icon={<BarChart3 className="h-5 w-5" />}
            accent="cyan"
          />
          <MetricCard
            label="Skor Sentiment Rata-rata"
            value="69%"
            delta="+5.2% trend positif"
            deltaTone="up"
            icon={<Target className="h-5 w-5" />}
            accent="success"
          />
          <MetricCard
            label="Sumber Media Aktif"
            value="90"
            delta="+3 baru"
            deltaTone="up"
            icon={<Globe className="h-5 w-5" />}
            accent="violet"
          />
          <MetricCard
            label="Update Real-time"
            value="182"
            delta="↻ 4 detik lalu"
            deltaTone="neutral"
            icon={<Zap className="h-5 w-5" />}
            accent="amber"
          />
        </div>
      </section>

      {/* Tabs */}
      <section className="mx-auto mt-10 max-w-[1440px] px-6">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-panel p-1">
          {(
            [
              { id: "fitur", label: "Fitur Utama", icon: BarChart3 },
              { id: "aktivitas", label: "Aktivitas Real-time", icon: Activity },
              { id: "quick", label: "Quick Analysis", icon: Brain },
            ] as const
          ).map((tt) => {
            const I = tt.icon;
            return (
              <button
                key={tt.id}
                onClick={() => setTab(tt.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  tab === tt.id
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.78_0.18_195_/_0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <I className="h-4 w-4" /> {tt.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {tab === "fitur" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon;
                const grad = {
                  cyan: "bg-gradient-cyan",
                  success: "bg-gradient-success",
                  violet: "bg-gradient-violet",
                  amber: "bg-gradient-amber",
                  magenta: "bg-gradient-magenta",
                  danger: "bg-gradient-danger",
                }[f.accent];
                return (
                  <Link
                    key={f.title}
                    to={f.to}
                    className="panel group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${grad} opacity-10 blur-2xl transition-opacity group-hover:opacity-25`} />
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${grad} text-background shadow-[0_0_18px_-4px_oklch(0.78_0.18_195_/_0.5)]`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-foreground">{f.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                    <div className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary opacity-80 transition-opacity group-hover:opacity-100">
                      Explore Feature <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {tab === "aktivitas" && (
            <Panel
              title="Aktivitas Real-time"
              icon={<Clock className="h-4 w-4" />}
              action={
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-success">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" /> Live
                </span>
              }
            >
              <ul className="divide-y divide-border">
                {activities.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`mt-1.5 h-2 w-2 rounded-full ${a.dot} animate-pulse-dot`} />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <Pill tone="info">{a.tag}</Pill>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {tab === "quick" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Sentiment Trend Hari Ini" icon={<TrendingUp className="h-4 w-4" />}>
                <div className="space-y-4">
                  <Bar label="Positif" value={68} color="success" />
                  <Bar label="Negatif" value={22} color="danger" />
                  <Bar label="Netral" value={10} color="neutral" />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-4">
                  {[
                    { l: "Total", v: "1,302" },
                    { l: "Sumber", v: "90" },
                    { l: "Akurasi", v: "94%" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg border border-border bg-panel-elevated p-3 text-center">
                      <p className="font-display text-lg font-bold text-foreground">{s.v}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Topik Trending" icon={<MessageSquare className="h-4 w-4" />}>
                <ul className="space-y-3">
                  {topics.map((t) => (
                    <li key={t.name} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel-elevated p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{t.mentions} mentions · {t.change}</p>
                      </div>
                      <Pill tone={t.sentiment === "positive" ? "positive" : t.sentiment === "negative" ? "negative" : "warning"}>
                        {t.sentiment}
                      </Pill>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-12 max-w-[1440px] px-6 pb-16">
        <div className="panel relative overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-violet opacity-20 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-cyan opacity-20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">▸ Ready Status</p>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                Mulai <span className="text-gradient-primary">Analisis Sekarang</span>
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Akses dashboard lengkap untuk monitoring dan analisis sentiment real-time dari seluruh sumber media Indonesia.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-gradient-cta px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_-4px_oklch(0.65_0.22_295_/_0.6)] transition-transform hover:scale-[1.02]">
                <BarChart3 className="h-4 w-4" /> Dashboard
              </Link>
              <Link to="/search" className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel-elevated px-5 py-3 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <Search className="h-4 w-4" /> Mulai Cari
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
