import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Bar, Pill } from "@/components/PageShell";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Target, CheckCircle2, TrendingUp, Clock, Star, Download, RefreshCw, Filter, Eye, Settings, Play, FileText, Activity, BarChart3, Calendar } from "lucide-react";

export const Route = createFileRoute("/recommendations")({
  head: () => ({ meta: [{ title: "Action Recommendations — PROPAM" }, { name: "description", content: "Strategi dan rekomendasi berbasis AI." }] }),
  component: Page,
});

const projection = Array.from({ length: 6 }, (_, i) => ({ w: `Week ${i + 1}`, baseline: 15 + i * 12, projected: 20 + i * 14 }));
const priority = [
  { name: "High Priority", value: 45, color: "oklch(0.65 0.24 22)" },
  { name: "Medium Priority", value: 35, color: "oklch(0.82 0.18 80)" },
  { name: "Low Priority", value: 20, color: "oklch(0.78 0.2 150)" },
];
const recs = [
  { icon: FileText, title: "Fokus pada Konten Reformasi Birokrasi", priority: "high", status: "pending", conf: 87, desc: "Tingkatkan produksi konten terkait reformasi birokrasi yang mengutamakan transparansi publik",
    rationale: "Analisis menunjukkan audience 24% engagement rate lebih tinggi dari rata-rata, dan topik ini sedang trending dengan potensi jangkauan yang sangat baik.",
    actions: ["Buat artikel mendalam tentang implementasi kebijakan", "Produksi infografis sederhana untuk publik", "Siapkan konten dengan prediksi terkait"],
    impact: { eng: "+24%", reach: "tinggi", time: "2-3 minggu" }, metrics: { e: "24% engagement rate", r: "15-20% jangkauan baru", s: "+12% sentiment positif" } },
  { icon: TrendingUp, title: "Ekspansi Coverage Teknologi Pendidikan", priority: "high", status: "pending", conf: 91, desc: "Membuka topik yang belum tertutup dengan baik dengan coverage yang intensif",
    rationale: "Prediksi AI menunjukkan gap besar di area teknologi pendidikan dengan potensi 65% audience growth dalam 4-6 minggu.",
    actions: ["Riset mendalam tren teknologi pendidikan", "Bangun partnership dengan stakeholder pendidikan", "Buat coverage eksklusif implementasi kebijakan"],
    impact: { eng: "+65%", reach: "tinggi", time: "4-6 minggu" }, metrics: { e: "65% coverage expansion", r: "40-50% new audience", s: "+18% positif sentiment" } },
];
const timeline = [
  { dot: "bg-amber", title: "Fokus pada Konten Reformasi Birokrasi", t: "2-3 minggu", priority: "high", conf: 87 },
  { dot: "bg-cyan", title: "Optimalisasi Trending Publikasi", t: "1-2 minggu", priority: "medium", conf: 76 },
  { dot: "bg-amber", title: "Ekspansi Coverage Teknologi Pendidikan", t: "4-6 minggu", priority: "high", conf: 91 },
  { dot: "bg-violet", title: "Monitor Sentiment Inflasi", t: "ongoing", priority: "medium", conf: 83 },
];

function Page() {
  return (
    <PageShell eyebrow="AI Strategy" title="Rekomendasi Aksi" description="Strategi dan rekomendasi berbasis AI untuk optimasi monitoring media dan engagement."
      actions={
        <>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs text-foreground"><option>30 Hari</option></select>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2 text-xs text-foreground"><Download className="h-3.5 w-3.5" /> Export Plan</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"><RefreshCw className="h-3.5 w-3.5" /> Generate New</button>
        </>
      }>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard label="Total Actions" value="24" accent="cyan" icon={<Target className="h-5 w-5" />} />
        <MetricCard label="Implemented" value="12" accent="success" icon={<CheckCircle2 className="h-5 w-5" />} />
        <MetricCard label="Expected ROI" value="156%" accent="violet" icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Avg Timeline" value="2.3w" accent="amber" icon={<Clock className="h-5 w-5" />} />
        <MetricCard label="Success Rate" value="89%" accent="success" icon={<Star className="h-5 w-5" />} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-panel p-4">
        <span className="font-mono text-xs text-muted-foreground">Priority:</span>
        <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>High</option></select>
        <span className="font-mono text-xs text-muted-foreground">Category:</span>
        <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>All Categories</option></select>
        <button className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><Filter className="h-3 w-3" /> Advanced Filters</button>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><Eye className="h-3 w-3" /> View Templates</button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-1 rounded-xl border border-border bg-panel p-1">
        {["Recommendations Overview", "Implementation Plan", "Impact Analytics"].map((t, i) => (
          <button key={t} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${i === 0 ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.78_0.18_195_/_0.3)]" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {recs.map((r) => {
          const I = r.icon;
          return (
            <Panel key={r.title} title={<div className="flex items-center gap-2"><I className="h-4 w-4 text-primary" /> {r.title}</div>} action={<div className="flex gap-2"><Pill tone="negative">{r.priority} priority</Pill><Pill tone="warning">⚠ {r.status}</Pill><Pill tone="info">{r.conf}% confidence</Pill></div>}>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
              <div className="mt-3 rounded-lg border border-info/30 bg-info/10 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-info">Rationale</p>
                <p className="mt-1 text-sm text-foreground">{r.rationale}</p>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-bold text-foreground">Action Items</p>
                  <ul className="mt-2 space-y-1.5">
                    {r.actions.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-sm text-muted-foreground"><input type="checkbox" className="mt-1 accent-primary" /> {a}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Expected Impact</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className="flex items-center justify-between"><span className="text-muted-foreground">Engagement Increase</span><span className="font-mono font-bold text-success">{r.impact.eng}</span></li>
                    <li className="flex items-center justify-between"><span className="text-muted-foreground">Reach Expansion</span><Pill tone="positive">{r.impact.reach}</Pill></li>
                    <li className="flex items-center justify-between"><span className="text-muted-foreground">Timeline</span><span className="font-mono text-foreground">{r.impact.time}</span></li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-panel-elevated p-3">
                <p className="text-sm font-bold text-foreground">Target Metrics</p>
                <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                  <div><p className="text-muted-foreground">Engagement:</p><p className="font-mono text-foreground">{r.metrics.e}</p></div>
                  <div><p className="text-muted-foreground">Reach:</p><p className="font-mono text-foreground">{r.metrics.r}</p></div>
                  <div><p className="text-muted-foreground">Sentiment:</p><p className="font-mono text-foreground">{r.metrics.s}</p></div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><Eye className="h-3 w-3" /> View Details</button>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><Settings className="h-3 w-3" /> Configure</button>
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"><Play className="h-3 w-3" /> Implement</button>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Implementation Progress" icon={<BarChart3 className="h-4 w-4" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.78 0.18 195)" stopOpacity={0.4} /><stop offset="100%" stopColor="oklch(0.78 0.18 195)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.78 0.2 150)" stopOpacity={0.4} /><stop offset="100%" stopColor="oklch(0.78 0.2 150)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="w" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="baseline" stroke="oklch(0.78 0.18 195)" fill="url(#g1)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="projected" stroke="oklch(0.78 0.2 150)" fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Priority Distribution" icon={<Target className="h-4 w-4" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priority} dataKey="value" innerRadius={56} outerRadius={88} paddingAngle={3}>
                  {priority.map((p, i) => <Cell key={i} fill={p.color} stroke="oklch(0.18 0.03 252)" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6" title="Implementation Timeline" icon={<Calendar className="h-4 w-4" />}>
        <ul className="space-y-3">
          {timeline.map((t) => (
            <li key={t.title} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
                <div><p className="text-sm font-semibold text-foreground">{t.title}</p><p className="font-mono text-[11px] text-muted-foreground">{t.t}</p></div>
              </div>
              <div className="flex items-center gap-2"><Pill tone={t.priority === "high" ? "negative" : "warning"}>{t.priority}</Pill><span className="font-mono text-[11px] text-muted-foreground">{t.conf}% confidence</span></div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-6" title="Key Performance Indicators" icon={<Activity className="h-4 w-4" />}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Bar label="Overall Progress" value={72} color="success" />
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Engagement Growth</span><Pill tone="positive">+28%</Pill></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Reach Expansion</span><Pill tone="info">+45%</Pill></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Sentiment Improvement</span><Pill tone="violet">+15%</Pill></div>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Quick Wins</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-2.5"><span className="text-foreground">Optimal posting time</span><CheckCircle2 className="h-4 w-4 text-success" /></li>
              <li className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-2.5"><span className="text-foreground">Content categorization</span><CheckCircle2 className="h-4 w-4 text-success" /></li>
              <li className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-2.5"><span className="text-foreground">Sentiment monitoring</span><Clock className="h-4 w-4 text-amber" /></li>
            </ul>
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
