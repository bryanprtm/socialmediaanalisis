import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Bar, Pill } from "@/components/PageShell";
import { ResponsiveContainer, BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Calendar, Zap, Brain, Target, Activity, Hash, Newspaper } from "lucide-react";
import { useActiveKeyword } from "@/hooks/use-active-keyword";
import { evalExpression } from "@/lib/keyword-query";

export const Route = createFileRoute("/sentiment")({
  head: () => ({
    meta: [
      { title: "Sentiment Analysis — PROPAM Command Center" },
      { name: "description", content: "Analisis sentiment mendalam dengan AI dan machine learning." },
    ],
  }),
  component: SentimentPage,
});

const distribution = [
  { name: "Sangat Positif", value: 28, color: "oklch(0.78 0.2 150)" },
  { name: "Positif", value: 25, color: "oklch(0.7 0.18 165)" },
  { name: "Netral", value: 20, color: "oklch(0.65 0.02 240)" },
  { name: "Negatif", value: 17, color: "oklch(0.65 0.24 22)" },
  { name: "Sangat Negatif", value: 10, color: "oklch(0.55 0.24 15)" },
];

const trend = [
  { m: "Jan", pos: 60, neg: 25, net: 15 },
  { m: "Feb", pos: 65, neg: 22, net: 13 },
  { m: "Mar", pos: 58, neg: 28, net: 14 },
  { m: "Apr", pos: 70, neg: 18, net: 12 },
  { m: "May", pos: 68, neg: 20, net: 12 },
  { m: "Jun", pos: 75, neg: 15, net: 10 },
];

const keywords = [
  { n: 1, k: "ekonomi", m: 342, change: "+15%", tone: "positive" as const },
  { n: 2, k: "pembangunan", m: 289, change: "+8%", tone: "positive" as const },
  { n: 3, k: "kesehatan", m: 256, change: "-2%", tone: "neutral" as const },
  { n: 4, k: "pendidikan", m: 234, change: "+12%", tone: "positive" as const },
  { n: 5, k: "lingkungan", m: 198, change: "-5%", tone: "negative" as const },
  { n: 6, k: "transportasi", m: 176, change: "+3%", tone: "neutral" as const },
  { n: 7, k: "teknologi", m: 167, change: "+22%", tone: "positive" as const },
  { n: 8, k: "keamanan", m: 145, change: "+1%", tone: "neutral" as const },
];

const sources = [
  { name: "CNN Indonesia", code: "C", art: 156, rel: 92, pos: 65, neg: 20, net: 15 },
  { name: "Kompas", code: "K", art: 134, rel: 89, pos: 58, neg: 25, net: 17 },
  { name: "Detik", code: "D", art: 178, rel: 85, pos: 45, neg: 35, net: 20 },
  { name: "Tribun", code: "T", art: 98, rel: 78, pos: 52, neg: 28, net: 20 },
];

function SentimentPage() {
  const { active } = useActiveKeyword();
  const matches = (t: string) => !active || evalExpression(active.expression, t);
  const filteredKeywords = keywords.filter((k) => matches(k.k));
  const filteredSources = sources.filter((s) => matches(s.name));
  return (
    <PageShell
      eyebrow="AI Module · v3.1"
      title="Analisis Sentiment"
      description="Dashboard sentiment berita. Disaring berdasarkan kata kunci aktif."
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40">
            <Calendar className="h-3.5 w-3.5" /> 7d
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-4 py-2 text-xs font-semibold text-background shadow-[0_0_24px_-8px_oklch(0.78_0.18_195_/_0.7)]">
            <Zap className="h-3.5 w-3.5" /> Analisis Ulang
          </button>
        </>
      }
    >

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Artikel" value="1,247" delta="+12% dari minggu lalu" deltaTone="up" accent="cyan" icon={<Newspaper className="h-5 w-5" />} />
        <MetricCard label="Sentiment Positif" value="53%" delta="+5% dari periode sebelumnya" deltaTone="up" accent="success" icon={<Target className="h-5 w-5" />} />
        <MetricCard label="Sentiment Negatif" value="27%" delta="-3% dari periode sebelumnya" deltaTone="down" accent="danger" icon={<Target className="h-5 w-5" />} />
        <MetricCard label="Sentiment Netral" value="20%" delta="+2% stabilitas tinggi" deltaTone="neutral" accent="violet" icon={<Target className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Distribusi Sentiment" icon={<Brain className="h-4 w-4" />}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" innerRadius={56} outerRadius={84} paddingAngle={2}>
                  {distribution.map((d, i) => <Cell key={i} fill={d.color} stroke="oklch(0.18 0.03 252)" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-2">
            {distribution.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-foreground">{d.name}</span>
                </span>
                <span className="font-mono font-semibold text-foreground">{d.value}%</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Detail Sentiment" icon={<Target className="h-4 w-4" />}>
          <div className="space-y-4">
            <Bar label="Positif" value={53} color="success" />
            <Bar label="Negatif" value={27} color="danger" />
            <Bar label="Netral" value={20} color="neutral" />
          </div>
          <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Akurasi Model AI</span>
              <Pill tone="info">94.2%</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Confidence Score</span>
              <Pill tone="info">87.5%</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Sample</span>
              <span className="font-mono font-semibold text-foreground">1,247</span>
            </div>
          </div>
        </Panel>

        <div className="panel relative overflow-hidden p-5 bg-gradient-violet">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Zap className="h-4 w-4" /> Real-time Metrics
            </h3>
            <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/80">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" /> Live Monitoring
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-white/90">
                  <span>Artikel per Jam</span>
                  <span className="font-mono font-bold">156</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-gradient-cyan" style={{ width: "78%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-white/90">
                  <span>Engagement Rate</span>
                  <span className="font-mono font-bold">89%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-gradient-success" style={{ width: "89%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-white/90">
                  <span>Processing Speed</span>
                  <span className="font-mono font-bold">92%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-gradient-magenta" style={{ width: "92%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Panel className="mt-6" title="Tren Sentiment per Waktu" icon={<Activity className="h-4 w-4" />}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="m" stroke="oklch(0.7 0.025 240)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
              <RBar dataKey="pos" fill="oklch(0.78 0.2 150)" radius={[4, 4, 0, 0]} />
              <RBar dataKey="neg" fill="oklch(0.65 0.24 22)" radius={[4, 4, 0, 0]} />
              <RBar dataKey="net" fill="oklch(0.65 0.02 240)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Keyword dengan Sentiment Tertinggi" icon={<Hash className="h-4 w-4" />}>
          <ul className="space-y-2">
            {filteredKeywords.length === 0 ? <li className="py-4 text-center text-xs text-muted-foreground">Tidak ada keyword cocok</li> : filteredKeywords.map((k) => (
              <li key={k.k} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">#{k.n}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{k.k}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{k.m} mentions</p>
                  </div>
                </div>
                <Pill tone={k.tone}>{k.change}</Pill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Sentiment per Sumber Media" icon={<Newspaper className="h-4 w-4" />}>
          <ul className="space-y-3">
            {filteredSources.length === 0 ? <li className="py-4 text-center text-xs text-muted-foreground">Tidak ada sumber cocok</li> : filteredSources.map((s) => (
              <li key={s.code} className="rounded-lg border border-border bg-panel-elevated p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <Pill tone="info">{s.art} artikel</Pill>
                    <Pill tone="positive">{s.rel}% reliable</Pill>
                  </div>
                </div>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                  <div className="bg-success" style={{ width: `${s.pos}%` }} />
                  <div className="bg-destructive" style={{ width: `${s.neg}%` }} />
                  <div className="bg-muted-foreground/50" style={{ width: `${s.net}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>Pos {s.pos}%</span>
                  <span>Neg {s.neg}%</span>
                  <span>Net {s.net}%</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
