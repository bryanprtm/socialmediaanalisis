import { useState } from "react";
import {
  Pause,
  RefreshCw,
  BarChart3,
  Target,
  Globe,
  Zap,
  Search,
  Brain,
  TrendingUp,
  Network,
  Plus,
  MapPin,
  Download,
  Clock,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/propam-logo.png";

type TabId = "fitur" | "aktivitas" | "quick";

const stats = [
  { label: "Total Artikel Hari Ini", value: "1,302", icon: BarChart3, color: "text-brand-blue", barFrom: "from-brand-blue", barTo: "to-brand-purple" },
  { label: "Skor Sentiment Rata-rata", value: "69%", icon: Target, color: "text-success", barFrom: "from-success", barTo: "to-brand-green" },
  { label: "Sumber Media Aktif", value: "90", icon: Globe, color: "text-brand-purple", barFrom: "from-brand-purple", barTo: "to-brand-blue" },
  { label: "Update Real-time", value: "182", icon: Zap, color: "text-brand-orange", barFrom: "from-brand-orange", barTo: "to-warning" },
];

const features = [
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Visualisasi data komprehensif dengan grafik interaktif dan metrik real-time", grad: "from-brand-blue to-info", to: "/dashboard" },
  { icon: Search, title: "Search & Monitoring", desc: "Pencarian berita dan monitoring sentiment dengan filter advanced", grad: "from-success to-brand-green", to: "/search" },
  { icon: Brain, title: "Sentiment Analysis", desc: "Analisis sentiment mendalam dengan AI dan machine learning", grad: "from-brand-purple to-primary", to: "/sentiment" },
  { icon: TrendingUp, title: "Trends & Topics", desc: "Analisis trending topics dan evolusi perbincangan publik", grad: "from-brand-orange to-warning", to: "/trends" },
  { icon: Globe, title: "Media Analysis", desc: "Monitoring kredibilitas dan performa sumber media secara mendalam", grad: "from-brand-purple to-brand-blue", to: "/media" },
  { icon: Network, title: "SNA Visualization", desc: "Visualisasi jaringan sosial dan analisis pola komunikasi interaktif", grad: "from-success to-info", to: "/sna" },
  { icon: Zap, title: "Issue Prediction", desc: "Prediksi tren dan perubahan topik menggunakan machine learning dan AI", grad: "from-warning to-brand-orange", to: "/prediction" },
  { icon: Plus, title: "Keyword & RSS Manager", desc: "Kelola kata kunci dan RSS feed untuk monitoring media yang optimal", grad: "from-destructive to-brand-orange", to: "/rss" },
  { icon: BarChart3, title: "Comparative Analysis", desc: "Bandingkan sentiment dan performa topik antar berbagai sumber media", grad: "from-foreground to-muted-foreground", to: "/comparative" },
  { icon: Target, title: "Action Recommendations", desc: "Strategi dan rekomendasi berbasis AI untuk optimasi monitoring media", grad: "from-info to-brand-blue", to: "/recommendations" },
  { icon: Download, title: "Export Report", desc: "Generate dan export laporan monitoring media dengan format WhatsApp", grad: "from-brand-purple to-primary", to: "/export" },
  { icon: MapPin, title: "Peta Indonesia", desc: "Distribusi geografis sentiment di seluruh nusantara", grad: "from-destructive to-warning", to: "/map" },
];

const activities = [
  { dot: "bg-success", title: "Analisis sentiment artikel Politik selesai", time: "2 menit lalu" },
  { dot: "bg-brand-blue", title: "126 artikel baru diproses dari CNN Indonesia", time: "5 menit lalu" },
  { dot: "bg-success", title: "Tren positif terdeteksi pada topik Ekonomi", time: "8 menit lalu" },
  { dot: "bg-warning", title: "Update data geografis Jakarta", time: "12 menit lalu" },
  { dot: "bg-brand-blue", title: "Backup otomatis database berhasil", time: "15 menit lalu" },
];

const sentimentTrend = [
  { label: "Positif", value: 68, colorClass: "text-success", bar: "bg-success" },
  { label: "Negatif", value: 22, colorClass: "text-destructive", bar: "bg-destructive" },
  { label: "Netral", value: 10, colorClass: "text-muted-foreground", bar: "bg-sentiment-neutral" },
];

const topics = [
  { name: "Pembangunan Infrastruktur", mentions: 342, sentiment: "positive" },
  { name: "Kebijakan Ekonomi", mentions: 289, sentiment: "mixed" },
  { name: "Program Kesehatan", mentions: 234, sentiment: "positive" },
  { name: "Pendidikan Digital", mentions: 198, sentiment: "positive" },
  { name: "Lingkungan Hidup", mentions: 167, sentiment: "negative" },
];

export function HomeView() {
  const [tab, setTab] = useState<TabId>("fitur");
  const [live, setLive] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        {/* Hero */}
        <section className="text-center">
          <div className="flex items-center justify-center gap-4">
            <img src={logo} alt="PROPAM logo" width={72} height={72} className="h-16 w-16 sm:h-20 sm:w-20" />
            <div className="text-left">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                MONITORING MEDIA <span className="text-gradient-primary">PROPAM</span>
              </h1>
              <p className="mt-1 text-sm font-medium text-info sm:text-base">
                Sentiment Analysis & Media Monitoring Platform
              </p>
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Platform monitoring berita dan analisis sentiment berbasis AI untuk memahami opini publik
            dari berbagai sumber media di Indonesia secara <span className="font-semibold text-foreground">real-time melalui RSS Feed</span>.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setLive((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-card transition-transform hover:scale-[1.02]"
            >
              <Pause className="h-4 w-4" />
              {live ? "Live Mode Active" : "Live Mode Paused"}
              <span className={`ml-1 inline-block h-2 w-2 rounded-full bg-success ${live ? "animate-pulse-dot" : "opacity-40"}`} />
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
          </div>
        </section>

        {/* Stat Cards */}
        <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className={`mt-2 font-display text-4xl font-extrabold ${s.color}`}>{s.value}</p>
                  </div>
                  <div className="rounded-xl bg-muted p-2.5">
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-muted">
                  <div className={`h-full bg-gradient-to-r ${s.barFrom} ${s.barTo}`} style={{ width: "75%" }} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Tabs */}
        <section className="mt-10">
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
            {([
              { id: "fitur", label: "Fitur Utama" },
              { id: "aktivitas", label: "Aktivitas Real-time" },
              { id: "quick", label: "Quick Analysis" },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  tab === t.id
                    ? "bg-background text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "fitur" && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.title}
                      className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-elevated"
                    >
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.grad} shadow-card`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold text-foreground">{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                      <Link
                        to={f.to}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                      >
                        Explore Feature <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "aktivitas" && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                    <Clock className="h-5 w-5 text-primary" /> Aktivitas Real-time
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" />
                    Live
                  </span>
                </div>
                <ul className="mt-6 space-y-5">
                  {activities.map((a, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${a.dot}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "quick" && (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                    <TrendingUp className="h-5 w-5 text-success" /> Sentiment Trend Hari Ini
                  </h3>
                  <div className="mt-6 space-y-5">
                    {sentimentTrend.map((s) => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{s.label}</span>
                          <span className={`font-bold ${s.colorClass}`}>{s.value}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full ${s.bar} transition-all`} style={{ width: `${s.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                    <MessageSquare className="h-5 w-5 text-primary" /> Topik Trending
                  </h3>
                  <ul className="mt-6 space-y-4">
                    {topics.map((t) => (
                      <li key={t.name} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.mentions} mentions</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            t.sentiment === "positive"
                              ? "bg-success/15 text-success"
                              : t.sentiment === "negative"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-warning/20 text-warning-foreground"
                          }`}
                        >
                          {t.sentiment}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 overflow-hidden rounded-3xl bg-gradient-cta p-8 shadow-elevated sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="text-white">
              <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Mulai Analisis Sekarang</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                Akses dashboard lengkap untuk monitoring dan analisis sentiment real-time.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary shadow-card transition-transform hover:scale-[1.03]"
              >
                <BarChart3 className="h-4 w-4" /> Dashboard
              </Link>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <Search className="h-4 w-4" /> Mulai Cari
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
