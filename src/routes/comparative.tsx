import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, Pill } from "@/components/PageShell";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { Brain, Download, Play, GitCompare, TrendingUp, Users, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/comparative")({
  head: () => ({ meta: [{ title: "Comparative Analysis — PROPAM" }, { name: "description", content: "Bandingkan sentiment dan performa antar sumber media." }] }),
  component: Page,
});

const trendCompare = [
  { d: "Sen", a: 65, b: 45 }, { d: "Sel", a: 72, b: 52 }, { d: "Rab", a: 68, b: 48 },
  { d: "Kam", a: 78, b: 58 }, { d: "Jum", a: 85, b: 62 }, { d: "Sab", a: 80, b: 60 }, { d: "Min", a: 78, b: 55 },
];
const radar = [
  { m: "Volume", a: 85, b: 60 }, { m: "Sentiment", a: 72, b: 58 }, { m: "Engagement", a: 78, b: 55 },
  { m: "Credibility", a: 88, b: 72 }, { m: "Reach", a: 80, b: 50 }, { m: "Impact", a: 75, b: 60 },
];

function Page() {
  return (
    <PageShell eyebrow="Side-by-Side" title="Analisis Komparatif" description="Bandingkan sentiment dan performa topik antar berbagai sumber media."
      actions={
        <>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs text-foreground"><option>7 Hari</option></select>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2 text-xs text-foreground"><Download className="h-3.5 w-3.5" /> Export</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"><Play className="h-3.5 w-3.5" /> Run Analysis</button>
        </>
      }>
      <Panel className="bg-gradient-violet" title="AI Comparative Analysis" icon={<Brain className="h-4 w-4 text-white" />}>
        <p className="text-sm text-white/85">Kecerdasan buatan membantu Anda memahami perbandingan untuk mengidentifikasi tren dan perbedaan kunci.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div><p className="font-mono text-[10px] uppercase tracking-wider text-white/80">Source A</p>
            <select className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white"><option>CNN Indonesia</option></select></div>
          <div><p className="font-mono text-[10px] uppercase tracking-wider text-white/80">Source B</p>
            <select className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white"><option>Tempo</option></select></div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div><p className="text-xs font-bold text-white">🎯 Key Differences</p>
            <div className="mt-2 space-y-2">
              {[
                { t: "Volume Coverage", v: "94%", d: "CNN Indonesia memiliki 48% lebih banyak artikel tentang reformasi birokrasi dibandingkan Tempo dalam 7 hari terakhir" },
                { t: "Sentiment Tone", v: "87%", d: "Terdapat perbedaan signifikan dalam tone pemberitaan: CNN cenderung 28% lebih positif dalam topik ekonomi digital" },
                { t: "Public Engagement", v: "91%", d: "Artikel Kompas menghasilkan engagement rate 34% lebih tinggi untuk topik isu energi dibandingkan media lain" },
              ].map((k) => (
                <div key={k.t} className="rounded-lg bg-black/30 p-3">
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">{k.t}</span><Pill tone="info">{k.v}</Pill></div>
                  <p className="mt-1 text-xs text-white/80">{k.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div><p className="text-xs font-bold text-white">⚡ Recommendations</p>
            <div className="mt-2 space-y-2">
              {[
                { t: "Media Strategy Optimization", lvl: "high", d: "Fokuskan strategi komunikasi pada platform dengan engagement tertinggi untuk topik spesifik" },
                { t: "Content Timing", lvl: "medium", d: "Publikasi konten terkait reformasi birokrasi optimal pada jam 10-12 dan 19-21 berdasarkan pola engagement" },
              ].map((r) => (
                <div key={r.t} className="rounded-lg bg-black/30 p-3">
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">{r.t}</span><Pill tone={r.lvl === "high" ? "negative" : "warning"}>{r.lvl}</Pill></div>
                  <p className="mt-1 text-xs text-white/80">{r.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Reformasi Birokrasi" icon={<TrendingUp className="h-4 w-4" />} action={<Pill tone="positive">Most Engaged</Pill>}>
          <ul className="space-y-2">
            {[{ n: "CNN Indonesia", v: 72, ch: "+13%" }, { n: "Tempo", v: 44, ch: "-8%" }, { n: "Kompas", v: 63, ch: "+5%" }, { n: "Detik", v: 58, ch: "-2%" }].map((s) => (
              <li key={s.n} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan" /><p className="text-sm font-semibold text-foreground">{s.n}</p></div>
                <div className="text-right"><p className="font-mono text-sm font-bold text-foreground">{s.v}%</p><p className={`font-mono text-[10px] ${s.ch.startsWith("-") ? "text-destructive" : "text-success"}`}>{s.ch}</p></div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Ringkasan Semua Perbandingan" icon={<GitCompare className="h-4 w-4" />}>
          <ul className="space-y-3">
            {[
              { n: "Reformasi Birokrasi", a: 72, b: 18, c: 10, ch: "+13%", art: 145 },
              { n: "Ekonomi Digital", a: 68, b: 22, c: 10, ch: "+8%", art: 187 },
              { n: "Isu Energi", a: 34, b: 54, c: 12, ch: "-15%", art: 98 },
            ].map((t) => (
              <li key={t.n} className="rounded-lg border border-border bg-panel-elevated p-3">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">{t.n}</span><Pill tone={t.ch.startsWith("-") ? "negative" : "positive"}>{t.ch}</Pill></div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div><p className="font-mono text-sm font-bold text-success">{t.a}%</p><p className="font-mono text-[10px] text-muted-foreground">Positif</p></div>
                  <div><p className="font-mono text-sm font-bold text-destructive">{t.b}%</p><p className="font-mono text-[10px] text-muted-foreground">Negatif</p></div>
                  <div><p className="font-mono text-sm font-bold text-muted-foreground">{t.c}%</p><p className="font-mono text-[10px] text-muted-foreground">Netral</p></div>
                </div>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">{t.art} articles analyzed</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Trend Comparison — 7 Days">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendCompare}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="d" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="a" name="CNN Indonesia" stroke="oklch(0.78 0.18 195)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="b" name="Tempo" stroke="oklch(0.65 0.24 22)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Multi-dimensional Analysis">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
                <PolarAngleAxis dataKey="m" tick={{ fill: "oklch(0.7 0.025 240)", fontSize: 11 }} />
                <Radar dataKey="a" stroke="oklch(0.78 0.18 195)" fill="oklch(0.78 0.18 195)" fillOpacity={0.3} />
                <Radar dataKey="b" stroke="oklch(0.65 0.24 22)" fill="oklch(0.65 0.24 22)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="panel relative overflow-hidden bg-gradient-success p-5 text-white"><CheckCircle2 className="absolute right-4 top-4 h-6 w-6 opacity-80" /><p className="text-sm font-bold">Best Performer</p><p className="mt-2 text-xl font-bold">CNN Indonesia</p><p className="mt-1 text-xs opacity-80">72% positive sentiment</p></div>
        <div className="panel relative overflow-hidden bg-gradient-amber p-5 text-white"><TrendingUp className="absolute right-4 top-4 h-6 w-6 opacity-80" /><p className="text-sm font-bold">Trending Topic</p><p className="mt-2 text-xl font-bold">Reformasi Birokrasi</p><p className="mt-1 text-xs opacity-80">+13% growth this week</p></div>
        <div className="panel relative overflow-hidden bg-gradient-violet p-5 text-white"><Users className="absolute right-4 top-4 h-6 w-6 opacity-80" /><p className="text-sm font-bold">High Engagement</p><p className="mt-2 text-xl font-bold">Kompas.com</p><p className="mt-1 text-xs opacity-80">15.8K interactions</p></div>
      </div>
    </PageShell>
  );
}
