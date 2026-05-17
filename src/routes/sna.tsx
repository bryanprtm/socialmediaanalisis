import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Network, Play, RefreshCw, Maximize, Download, Eye, Settings } from "lucide-react";
import { useActiveKeyword } from "@/hooks/use-active-keyword";
import { evalExpression } from "@/lib/keyword-query";

export const Route = createFileRoute("/sna")({
  head: () => ({ meta: [{ title: "SNA Visualization — PROPAM" }, { name: "description", content: "Social Network Analysis untuk memahami pola komunikasi." }] }),
  component: Page,
});

const nodes = [
  { id: "Kompas", x: 50, y: 50, color: "oklch(0.78 0.18 195)", size: 18 },
  { id: "CNN", x: 28, y: 30, color: "oklch(0.78 0.2 150)", size: 14 },
  { id: "Detik", x: 72, y: 30, color: "oklch(0.65 0.22 295)", size: 14 },
  { id: "Tempo", x: 30, y: 70, color: "oklch(0.65 0.24 22)", size: 12 },
  { id: "Tribun", x: 70, y: 70, color: "oklch(0.82 0.18 80)", size: 12 },
  { id: "Tech", x: 50, y: 12, color: "oklch(0.65 0.22 295)", size: 11 },
  { id: "Politik", x: 50, y: 82, color: "oklch(0.65 0.24 22)", size: 11 },
  { id: "Ekonomi", x: 88, y: 50, color: "oklch(0.82 0.18 80)", size: 11 },
  { id: "Influencer", x: 12, y: 50, color: "oklch(0.7 0.25 330)", size: 11 },
  { id: "Official", x: 78, y: 22, color: "oklch(0.78 0.2 150)", size: 11 },
];
const links: Array<[string, string]> = [
  ["Kompas", "CNN"], ["Kompas", "Detik"], ["Kompas", "Tempo"], ["Kompas", "Tribun"],
  ["Kompas", "Ekonomi"], ["Kompas", "Politik"], ["CNN", "Tech"], ["Detik", "Official"], ["Tempo", "Influencer"],
];
const between = [
  { n: 1, name: "Kompas.com", v: 92.4, deg: 52 },
  { n: 2, name: "CNN Indonesia", v: 85.1, deg: 47 },
  { n: 3, name: "Detik.com", v: 78.4, deg: 41 },
  { n: 4, name: "Ekonomi Cluster", v: 74.2, deg: 38 },
  { n: 5, name: "Politik Cluster", v: 67.3, deg: 34 },
  { n: 6, name: "Teknologi Hub", v: 61.2, deg: 29 },
];
const pagerank = [
  { n: 1, name: "Kompas.com", v: 15.2, ch: -2.3 }, { n: 2, name: "CNN Indonesia", v: 12.4, ch: -1.8 },
  { n: 3, name: "Detik.com", v: 10.8, ch: -0.5 }, { n: 4, name: "Ekonomi Cluster", v: 9.5, ch: -2.1 },
  { n: 5, name: "Politik Cluster", v: 8.7, ch: -1.2 }, { n: 6, name: "Teknologi Hub", v: 7.8, ch: -4.2 },
];

function nodeById(id: string) { return nodes.find((n) => n.id === id)!; }

function Page() {
  const { active } = useActiveKeyword();
  const matches = (t: string) => !active || evalExpression(active.expression, t);
  const filteredBetween = between.filter((b) => matches(b.name));
  const filteredPagerank = pagerank.filter((p) => matches(p.name));
  const visibleNodes = active ? nodes.filter((n) => matches(n.id)) : nodes;
  const visibleLinks = active ? links.filter(([a, b]) => matches(a) && matches(b)) : links;
  return (
    <PageShell eyebrow="Network Topology" title="Visualisasi Jaringan SNA" description="Analisis Social Network Analysis tersaring berdasarkan kata kunci aktif."
      actions={
        <>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs text-foreground"><option>Jaringan Sosial</option></select>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-3 py-2 text-xs font-semibold text-background"><Play className="h-3.5 w-3.5" /> Simulate</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40"><Maximize className="h-3.5 w-3.5" /> Fullscreen</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40"><Download className="h-3.5 w-3.5" /> Export</button>
        </>
      }>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Nodes" value="40" accent="cyan" icon={<Network className="h-5 w-5" />} />
        <MetricCard label="Total Connections" value="127" accent="success" icon={<Network className="h-5 w-5" />} />
        <MetricCard label="Network Density" value="16.3%" accent="violet" icon={<Network className="h-5 w-5" />} />
        <MetricCard label="Avg Clustering" value="74.2%" accent="amber" icon={<Network className="h-5 w-5" />} />
      </div>

      <Panel className="mt-6" title="Jaringan Sosial" icon={<Network className="h-4 w-4" />} action={<Pill tone="info">Force-Directed</Pill>}>
        <div className="relative h-96 overflow-hidden rounded-xl bg-black/40 grid-bg">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
            {links.map(([a, b], i) => {
              const A = nodeById(a), B = nodeById(b);
              return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="oklch(1 0 0 / 0.2)" strokeWidth="0.3" />;
            })}
            {nodes.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={n.size / 6} fill={n.color} opacity={0.25} />
                <circle cx={n.x} cy={n.y} r={n.size / 10} fill={n.color} stroke="oklch(0.18 0.03 252)" strokeWidth="0.3" />
                <text x={n.x} y={n.y + 0.5} textAnchor="middle" fontSize="1.4" fill="white" fontWeight="700">{n.id}</text>
              </g>
            ))}
          </svg>
          <div className="absolute bottom-3 right-3 rounded-lg border border-border bg-popover/95 p-3 backdrop-blur">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Legend</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan" /> Media Sources</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" /> Topic Clusters</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-magenta" /> Influencers</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2 text-xs">
            <span className="font-mono text-muted-foreground">Layout:</span>
            <select className="rounded-md border border-border bg-panel-elevated px-2 py-1 text-xs text-foreground"><option>Force Directed</option></select>
            <span className="font-mono text-muted-foreground">Node Size:</span>
            <select className="rounded-md border border-border bg-panel-elevated px-2 py-1 text-xs text-foreground"><option>Centrality</option></select>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1 rounded-md border border-border bg-panel-elevated px-3 py-1 text-xs text-foreground"><Eye className="h-3 w-3" /> Focus</button>
            <button className="inline-flex items-center gap-1 rounded-md border border-border bg-panel-elevated px-3 py-1 text-xs text-foreground"><Settings className="h-3 w-3" /> Settings</button>
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Betweenness Centrality">
          <ul className="space-y-2">
            {between.map((b) => (
              <li key={b.n} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary">{b.n}</span>
                  <div><p className="text-sm font-semibold text-foreground">{b.name}</p><p className="font-mono text-[10px] text-muted-foreground">Degree: {b.deg}</p></div>
                </div>
                <div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-cyan" style={{ width: `${b.v}%` }} /></div><span className="font-mono text-xs text-foreground">{b.v}%</span></div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="PageRank Scores">
          <ul className="space-y-2">
            {pagerank.map((p) => (
              <li key={p.n} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
                <div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-md bg-success/15 font-mono text-xs font-bold text-success">{p.n}</span>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p></div>
                <div className="text-right"><p className="font-mono text-sm font-bold text-foreground">{p.v}%</p><p className="font-mono text-[10px] text-destructive">{p.ch}%</p></div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-6 bg-gradient-violet" title="Metrik SNA">
        <div className="grid gap-4 sm:grid-cols-3 text-white text-center">
          <div><p className="font-display text-3xl font-bold">14.3%</p><p className="font-mono text-xs uppercase tracking-wider opacity-80">Network Efficiency</p></div>
          <div><p className="font-display text-3xl font-bold">2.1</p><p className="font-mono text-xs uppercase tracking-wider opacity-80">Small World Index</p></div>
          <div><p className="font-display text-3xl font-bold">0.67</p><p className="font-mono text-xs uppercase tracking-wider opacity-80">Community Strength</p></div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2 text-white">
          <div><p className="text-sm font-bold">Key Findings</p><ul className="mt-2 space-y-1 text-xs opacity-90"><li>• Kompas.com sebagai central hub utama dalam jaringan media</li><li>• Cluster politik-ekonomi menunjukkan integrasi tinggi</li><li>• Influencer network memiliki peran bridging signifikan</li></ul></div>
          <div><p className="text-sm font-bold">Recommendations</p><ul className="mt-2 space-y-1 text-xs opacity-90"><li>• Tingkatkan koneksi dengan emerging tech clusters</li><li>• Monitor perubahan centrality scores secara berkala</li><li>• Identifikasi bridge nodes untuk strategi komunikasi</li></ul></div>
        </div>
      </Panel>
    </PageShell>
  );
}
