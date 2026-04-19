import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Bar, Pill } from "@/components/PageShell";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Search, Filter, Download, Settings, Globe, RefreshCw, ShieldCheck, Activity, Users, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Analysis — PROPAM Command Center" },
      { name: "description", content: "Monitoring kredibilitas, sentiment, dan performa sumber media secara real-time." },
    ],
  }),
  component: MediaPage,
});

const sources = [
  { code: "C", name: "CNN Indonesia", cat: "Nasional", art: 156, sent: 72, rel: 94, reach: "8.2M", eng: 87, trend: "+5.2%", relTone: "positive" as const },
  { code: "K", name: "Kompas.com", cat: "Nasional", art: 134, sent: 78, rel: 96, reach: "12.1M", eng: 91, trend: "+3.8%", relTone: "positive" as const },
  { code: "D", name: "Detik.com", cat: "Nasional", art: 189, sent: 65, rel: 88, reach: "15.3M", eng: 85, trend: "-2.1%", relTone: "positive" as const },
  { code: "T", name: "Tempo.co", cat: "Politik", art: 98, sent: 81, rel: 92, reach: "5.7M", eng: 79, trend: "+7.3%", relTone: "positive" as const },
  { code: "L", name: "Liputan6", cat: "Hiburan", art: 142, sent: 69, rel: 85, reach: "9.8M", eng: 82, trend: "+4.6%", relTone: "positive" as const },
  { code: "T", name: "Tribunnews", cat: "Regional", art: 167, sent: 58, rel: 76, reach: "11.2M", eng: 73, trend: "-1.8%", relTone: "warning" as const },
  { code: "O", name: "Okezone", cat: "Ekonomi", art: 123, sent: 63, rel: 79, reach: "7.4M", eng: 68, trend: "+2.9%", relTone: "warning" as const },
  { code: "A", name: "Antara News", cat: "Nasional", art: 87, sent: 84, rel: 98, reach: "4.1M", eng: 71, trend: "+6.1%", relTone: "positive" as const },
];

const volume = [
  { t: "00:00", a: 8, b: 12, c: 6, d: 3 },
  { t: "04:00", a: 14, b: 22, c: 10, d: 5 },
  { t: "08:00", a: 38, b: 48, c: 32, d: 18 },
  { t: "12:00", a: 48, b: 56, c: 40, d: 24 },
  { t: "16:00", a: 56, b: 62, c: 46, d: 28 },
  { t: "20:00", a: 40, b: 50, c: 36, d: 22 },
  { t: "24:00", a: 24, b: 32, c: 22, d: 14 },
];

const bias = [
  { cat: "Nasional", n: 421, p: 68, ne: 22, neg: 10, score: 29 },
  { cat: "Politik", n: 287, p: 45, ne: 35, neg: 20, score: 13 },
  { cat: "Ekonomi", n: 356, p: 72, ne: 18, neg: 10, score: 31 },
  { cat: "Teknologi", n: 198, p: 84, ne: 12, neg: 4, score: 40 },
  { cat: "Olahraga", n: 164, p: 76, ne: 20, neg: 4, score: 36 },
  { cat: "Hiburan", n: 234, p: 58, ne: 32, neg: 10, score: 24 },
];

function MediaPage() {
  return (
    <PageShell
      eyebrow="Source Intelligence"
      title="Analisis Media"
      description="Monitoring kredibilitas, sentiment, dan performa sumber media secara real-time."
      actions={
        <>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground"><option>24 Jam</option><option>7 Hari</option></select>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground"><option>Semua Kategori</option></select>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"><RefreshCw className="h-3.5 w-3.5" /> Auto Refresh</button>
        </>
      }
    >
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Cari sumber media…" className="w-full rounded-lg border border-border bg-panel py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
        </div>
        <select className="rounded-lg border border-border bg-panel px-4 py-2.5 text-sm text-foreground"><option>Kredibilitas</option></select>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"><Filter className="h-4 w-4" /> Filter Lanjutan</button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"><Download className="h-4 w-4" /> Export</button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"><Settings className="h-4 w-4" /> Konfigurasi</button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Artikel" value="1,096" accent="cyan" icon={<Activity className="h-5 w-5" />} delta="last 24h" />
        <MetricCard label="Skor Kredibilitas" value="89%" accent="success" icon={<ShieldCheck className="h-5 w-5" />} delta="High trust" deltaTone="up" />
        <MetricCard label="Sentiment Positif" value="68%" accent="violet" icon={<Activity className="h-5 w-5" />} delta="+5.2%" deltaTone="up" />
        <MetricCard label="Total Jangkauan" value="73.8M" accent="amber" icon={<Users className="h-5 w-5" />} delta="reach impressions" />
      </div>

      <Panel className="mt-6" title="Sumber Media & Kredibilitas" icon={<Globe className="h-4 w-4" />} action={<Pill tone="info">{sources.length} Sources</Pill>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Media</th>
                <th className="pb-3 pr-4">Artikel</th>
                <th className="pb-3 pr-4">Sentiment</th>
                <th className="pb-3 pr-4">Kredibilitas</th>
                <th className="pb-3 pr-4">Jangkauan</th>
                <th className="pb-3 pr-4">Engagement</th>
                <th className="pb-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sources.map((s, i) => (
                <tr key={i} className="hover:bg-panel-elevated/60">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-cyan font-mono text-xs font-bold text-background">{s.code}</span>
                      <div>
                        <p className="font-semibold text-foreground">{s.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{s.cat}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono font-semibold text-foreground">{s.art}</td>
                  <td className="py-3 pr-4">
                    <div className="flex w-32 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-gradient-success" style={{ width: `${s.sent}%` }} />
                      </div>
                      <span className="font-mono text-[11px] text-foreground">{s.sent}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4"><Pill tone={s.relTone}>{s.rel}%</Pill></td>
                  <td className="py-3 pr-4 font-mono text-foreground">{s.reach}</td>
                  <td className="py-3 pr-4">
                    <div className="flex w-28 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-gradient-cyan" style={{ width: `${s.eng}%` }} />
                      </div>
                      <span className="font-mono text-[11px] text-foreground">{s.eng}%</span>
                    </div>
                  </td>
                  <td className={`py-3 font-mono text-xs ${s.trend.startsWith("-") ? "text-destructive" : "text-success"}`}>
                    {s.trend.startsWith("-") ? <ArrowDown className="inline h-3 w-3" /> : <ArrowUp className="inline h-3 w-3" />} {s.trend}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-6" title="Volume Pemberitaan per Waktu" icon={<Activity className="h-4 w-4" />}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volume}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="t" stroke="oklch(0.7 0.025 240)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="a" name="CNN" stroke="oklch(0.78 0.18 195)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="b" name="Kompas" stroke="oklch(0.82 0.18 80)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="c" name="Detik" stroke="oklch(0.78 0.2 150)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="d" name="Tempo" stroke="oklch(0.65 0.24 22)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Mini l="Total Artikel" v="686" tone="text-cyan" />
          <Mini l="Share dan Engagement" v="7,590" tone="text-success" />
          <Mini l="Kredibilitas Rata-rata" v="86%" tone="text-violet" />
        </div>
      </Panel>

      <Panel className="mt-6" title="Analisis Bias per Kategori">
        <ul className="divide-y divide-border">
          {bias.map((b) => (
            <li key={b.cat} className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{b.cat}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{b.n} artikel · Bias Score {b.score}%</p>
              </div>
              <Bar label="Positif" value={b.p} color="success" />
              <Bar label="Netral" value={b.ne} color="neutral" />
              <Bar label="Negatif" value={b.neg} color="danger" />
            </li>
          ))}
        </ul>
      </Panel>
    </PageShell>
  );
}

function Mini({ l, v, tone }: { l: string; v: string; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel-elevated p-3 text-center">
      <p className={`font-display text-xl font-bold ${tone}`}>{v}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l}</p>
    </div>
  );
}
