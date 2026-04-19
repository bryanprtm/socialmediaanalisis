import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Bar, Pill } from "@/components/PageShell";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar as RBar } from "recharts";
import { Activity, Brain, AlertTriangle, Lightbulb, Download, Settings, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/prediction")({
  head: () => ({ meta: [{ title: "Issue Prediction — PROPAM" }, { name: "description", content: "Prediksi tren topik dengan machine learning." }] }),
  component: Page,
});

const trend = Array.from({ length: 7 }, (_, i) => ({ d: `Day ${i + 1}`, v: 45 + i * 5 + (i > 3 ? 8 : 0) }));
const perf = [
  { k: "Kebijakan Ekonomi", v: 88 }, { k: "Teknologi Digital", v: 76 },
  { k: "Program Kesehatan", v: 92 }, { k: "Infrastruktur", v: 81 },
];
const topics = [
  { n: "Kebijakan Ekonomi", c: 89, cur: 67, ch: "+12%", tone: "positive" as const, kf: ["Inflasi menurun", "Pertumbuhan GDP", "Kebijakan fiskal baru"] },
  { n: "Teknologi Digital", c: 76, cur: 84, ch: "-5%", tone: "negative" as const, kf: ["Regulasi baru", "Privasi data", "Kompetisi global"] },
  { n: "Program Kesehatan", c: 92, cur: 72, ch: "+18%", tone: "positive" as const, kf: ["BPJS expansion", "Telemedicine", "Preventive care"] },
  { n: "Infrastruktur", c: 81, cur: 58, ch: "+8%", tone: "positive" as const, kf: ["Proyek IKN", "Transportasi publik", "Smart city"] },
];

function Page() {
  return (
    <PageShell eyebrow="ML Forecast Engine" title="Prediksi Isu" description="Prediksi tren dan perubahan topik menggunakan machine learning dan AI analytics."
      actions={
        <>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs text-foreground"><option>7 Hari</option></select>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs text-foreground"><option>Ensemble Model</option></select>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"><RefreshCw className="h-3.5 w-3.5" /> Auto Update</button>
        </>
      }>
      <div className="flex items-center gap-4 rounded-lg border border-border bg-panel p-4">
        <span className="font-mono text-xs text-muted-foreground">Confidence Threshold:</span>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-cyan" style={{ width: "75%" }} /></div>
        <span className="font-mono text-xs font-semibold text-primary">75%</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">Model: <span className="text-foreground">ensemble</span></span>
        <button className="rounded-lg border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><Download className="inline h-3 w-3" /> Export</button>
        <button className="rounded-lg border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><Settings className="inline h-3 w-3" /> Config</button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Model Accuracy" value="87%" accent="success" icon={<Brain className="h-5 w-5" />} />
        <MetricCard label="Precision Score" value="92%" accent="cyan" icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Recall Rate" value="84%" accent="violet" icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="F1 Score" value="88%" accent="amber" icon={<Activity className="h-5 w-5" />} />
      </div>

      <Panel className="mt-6" title="Trend Prediction — 7 Hari ke Depan" icon={<Activity className="h-4 w-4" />} action={<Pill tone="info">Confidence 87%</Pill>}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.78 0.18 195)" stopOpacity={0.5} /><stop offset="100%" stopColor="oklch(0.78 0.18 195)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="d" stroke="oklch(0.7 0.025 240)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="v" stroke="oklch(0.78 0.18 195)" fill="url(#pg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-cyan/10 p-3 text-center"><p className="font-display text-xl font-bold text-cyan">+24%</p><p className="font-mono text-[10px] uppercase text-muted-foreground">Predicted Growth</p></div>
          <div className="rounded-lg bg-success/10 p-3 text-center"><p className="font-display text-xl font-bold text-success">87%</p><p className="font-mono text-[10px] uppercase text-muted-foreground">Avg Confidence</p></div>
          <div className="rounded-lg bg-violet/10 p-3 text-center"><p className="font-display text-xl font-bold text-violet">3.2%</p><p className="font-mono text-[10px] uppercase text-muted-foreground">Prediction Error</p></div>
        </div>
      </Panel>

      <Panel className="mt-6" title="Prediksi Perubahan Topik">
        <ul className="divide-y divide-border">
          {topics.map((t) => (
            <li key={t.n} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{t.n}</p>
                    <Pill tone="info">{t.c}% confidence</Pill>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">Current Trend</span>
                    <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-cyan" style={{ width: `${t.cur}%` }} /></div>
                    <span className="font-mono text-xs text-foreground">{t.cur}%</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">Key Factors:</span>
                    {t.kf.map((f) => <Pill key={f} tone="info">{f}</Pill>)}
                  </div>
                </div>
                <Pill tone={t.tone}>{t.ch}</Pill>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-6 bg-gradient-violet" title="AI Insight" icon={<Lightbulb className="h-4 w-4 text-white" />}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-bold text-white">Strategic Insights</h4>
            <div className="mt-3 space-y-2">
              {[
                { t: "Peak Recognition", v: 87, d: "Model memprediksi puncak diskusi kebijakan ekonomi akan terjadi 3-5 hari ke depan." },
                { t: "Market Opportunity", v: 74, d: "Gap dalam coverage topik teknologi blockchain dapat dimanfaatkan untuk meningkatkan engagement 34%." },
              ].map((i) => (
                <div key={i.t} className="rounded-lg bg-black/30 p-3">
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">{i.t}</span><Pill tone="info">{i.v}%</Pill></div>
                  <p className="mt-1 text-xs text-white/80">{i.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-white"><AlertTriangle className="h-4 w-4" /> Risk Alerts</h4>
            <div className="mt-3 space-y-2">
              {[
                { t: "Potential Viral Event", v: 78, d: "Potensi viral content terkait isu transportasi publik dengan probabilitas 78% dalam 48 jam." },
                { t: "High Volume Burst", v: 91, d: "Lonjakan volume artikel politik mencapai 300% di atas normal pada akhir pekan." },
              ].map((i) => (
                <div key={i.t} className="rounded-lg bg-black/30 p-3">
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">{i.t}</span><Pill tone="warning">{i.v}%</Pill></div>
                  <p className="mt-1 text-xs text-white/80">{i.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Model Performance">
          <div className="space-y-4">
            <Bar label="Accuracy" value={87} color="success" />
            <Bar label="Precision" value={92} color="primary" />
            <Bar label="Recall" value={84} color="violet" />
            <Bar label="F1 Score" value={88} color="warning" />
          </div>
        </Panel>
        <Panel title="Prediction Trends">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perf}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="k" stroke="oklch(0.7 0.025 240)" fontSize={10} />
                <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <RBar dataKey="v" fill="oklch(0.78 0.18 195)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
