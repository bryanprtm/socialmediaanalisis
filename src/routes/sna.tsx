import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { Network } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";

export const Route = createFileRoute("/sna")({
  head: () => ({ meta: [{ title: "SNA Visualization — PROPAM" }, { name: "description", content: "Network analysis sumber media & kategori dari news database." }] }),
  component: Page,
});

function Page() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);

  // Build network: sources <-> categories from real articles
  const topSources = s.sources.slice(0, 6);
  const topCats = s.categories.slice(0, 6);

  type Node = { id: string; type: "source" | "category"; count: number; x: number; y: number };
  const nodes: Node[] = [];
  topSources.forEach((src, i) => {
    const angle = (i / topSources.length) * Math.PI - Math.PI / 2;
    nodes.push({ id: src.name, type: "source", count: src.count, x: 50 + Math.cos(angle) * 35, y: 30 + Math.sin(angle) * 12 });
  });
  topCats.forEach((c, i) => {
    const angle = (i / topCats.length) * Math.PI + Math.PI / 2;
    nodes.push({ id: c.name, type: "category", count: c.count, x: 50 + Math.cos(angle) * 35, y: 70 + Math.sin(angle) * 12 });
  });

  // Links: where article has source AND category
  const linkMap = new Map<string, number>();
  for (const a of filtered) {
    if (!a.category) continue;
    if (!topSources.find((s2) => s2.name === a.source)) continue;
    if (!topCats.find((c) => c.name === a.category)) continue;
    const key = `${a.source}|${a.category}`;
    linkMap.set(key, (linkMap.get(key) ?? 0) + 1);
  }
  const links = [...linkMap.entries()].map(([k, w]) => {
    const [a, b] = k.split("|");
    return { a, b, w };
  });
  const maxW = Math.max(1, ...links.map((l) => l.w));
  const maxC = Math.max(1, ...nodes.map((n) => n.count));

  function findNode(id: string) {
    return nodes.find((n) => n.id === id);
  }

  return (
    <PageShell
      eyebrow="Network Topology"
      title="Visualisasi Jaringan SNA"
      description="Jaringan sumber media ↔ kategori dibangun dari news database. Disaring berdasarkan kata kunci aktif."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Nodes" value={String(nodes.length)} accent="cyan" icon={<Network className="h-5 w-5" />} />
        <MetricCard label="Edges" value={String(links.length)} accent="success" icon={<Network className="h-5 w-5" />} />
        <MetricCard label="Sumber" value={String(s.sources.length)} accent="violet" icon={<Network className="h-5 w-5" />} />
        <MetricCard label="Kategori" value={String(s.categories.length)} accent="amber" icon={<Network className="h-5 w-5" />} />
      </div>

      <Panel className="mt-6" title="Jaringan Sumber ↔ Kategori" icon={<Network className="h-4 w-4" />} action={<Pill tone="info">{active ? "Filtered" : "All data"}</Pill>}>
        {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p> : nodes.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Belum cukup data untuk membangun jaringan.</p>
        ) : (
          <div className="relative h-96 overflow-hidden rounded-xl bg-black/40 grid-bg">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
              {links.map((l, i) => {
                const A = findNode(l.a);
                const B = findNode(l.b);
                if (!A || !B) return null;
                return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="oklch(0.78 0.18 195 / 0.4)" strokeWidth={(l.w / maxW) * 0.8 + 0.1} />;
              })}
              {nodes.map((n) => {
                const r = 1.5 + (n.count / maxC) * 3;
                const color = n.type === "source" ? "oklch(0.78 0.18 195)" : "oklch(0.65 0.22 295)";
                return (
                  <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r={r * 1.8} fill={color} opacity={0.2} />
                    <circle cx={n.x} cy={n.y} r={r} fill={color} stroke="oklch(0.18 0.03 252)" strokeWidth={0.3} />
                    <text x={n.x} y={n.y + r + 1.8} textAnchor="middle" fontSize="1.6" fill="white" fontWeight="600">{n.id}</text>
                  </g>
                );
              })}
            </svg>
            <div className="absolute bottom-3 right-3 rounded-lg border border-border bg-popover/95 p-3 backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Legend</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan" /> Sumber Media</li>
                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet" /> Kategori</li>
              </ul>
            </div>
          </div>
        )}
      </Panel>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Sumber Paling Terhubung">
          {topSources.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Belum ada data.</p> : (
            <ul className="space-y-2">
              {topSources.map((src, i) => (
                <li key={src.name} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary">{i + 1}</span>
                    <p className="text-sm font-semibold text-foreground">{src.name}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-foreground">{src.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Kategori Paling Aktif">
          {topCats.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Belum ada data.</p> : (
            <ul className="space-y-2">
              {topCats.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-success/15 font-mono text-xs font-bold text-success">{i + 1}</span>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-foreground">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
