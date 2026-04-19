import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill, Bar } from "@/components/PageShell";
import { Map as MapIcon, MapPin, TrendingUp, Activity, Filter } from "lucide-react";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Peta Indonesia — PROPAM" },
      { name: "description", content: "Distribusi sentiment & berita per provinsi di Indonesia." },
    ],
  }),
  component: Page,
});

type Region = {
  id: string;
  name: string;
  cx: number;
  cy: number;
  r: number;
  count: number;
  sent: number; // 0-100, higher = more positive
};

const regions: Region[] = [
  { id: "ach", name: "Aceh", cx: 90, cy: 110, r: 14, count: 124, sent: 62 },
  { id: "smu", name: "Sumatera Utara", cx: 130, cy: 150, r: 18, count: 287, sent: 71 },
  { id: "smb", name: "Sumatera Barat", cx: 155, cy: 195, r: 14, count: 198, sent: 68 },
  { id: "rau", name: "Riau", cx: 185, cy: 175, r: 16, count: 234, sent: 58 },
  { id: "jbi", name: "Jambi", cx: 200, cy: 215, r: 12, count: 142, sent: 65 },
  { id: "smt", name: "Sumatera Selatan", cx: 230, cy: 250, r: 16, count: 312, sent: 73 },
  { id: "lpg", name: "Lampung", cx: 270, cy: 290, r: 14, count: 245, sent: 69 },
  { id: "bnt", name: "Banten", cx: 310, cy: 305, r: 12, count: 387, sent: 64 },
  { id: "jkt", name: "DKI Jakarta", cx: 335, cy: 305, r: 22, count: 1247, sent: 52 },
  { id: "jbr", name: "Jawa Barat", cx: 360, cy: 310, r: 18, count: 856, sent: 67 },
  { id: "jtg", name: "Jawa Tengah", cx: 410, cy: 310, r: 18, count: 678, sent: 74 },
  { id: "yog", name: "DI Yogyakarta", cx: 430, cy: 320, r: 12, count: 298, sent: 81 },
  { id: "jtm", name: "Jawa Timur", cx: 470, cy: 310, r: 18, count: 723, sent: 70 },
  { id: "bal", name: "Bali", cx: 530, cy: 330, r: 12, count: 421, sent: 84 },
  { id: "ntb", name: "NTB", cx: 580, cy: 325, r: 12, count: 187, sent: 76 },
  { id: "ntt", name: "NTT", cx: 640, cy: 340, r: 14, count: 156, sent: 72 },
  { id: "klb", name: "Kalimantan Barat", cx: 320, cy: 195, r: 16, count: 198, sent: 66 },
  { id: "klt", name: "Kalimantan Tengah", cx: 380, cy: 220, r: 16, count: 167, sent: 63 },
  { id: "kls", name: "Kalimantan Selatan", cx: 400, cy: 250, r: 14, count: 189, sent: 70 },
  { id: "klu", name: "Kalimantan Timur", cx: 440, cy: 200, r: 18, count: 312, sent: 68 },
  { id: "klr", name: "Kalimantan Utara", cx: 450, cy: 155, r: 12, count: 87, sent: 75 },
  { id: "sln", name: "Sulawesi Utara", cx: 600, cy: 175, r: 14, count: 145, sent: 78 },
  { id: "slt", name: "Sulawesi Tengah", cx: 570, cy: 220, r: 14, count: 132, sent: 65 },
  { id: "sls", name: "Sulawesi Selatan", cx: 555, cy: 280, r: 16, count: 312, sent: 71 },
  { id: "slr", name: "Sulawesi Tenggara", cx: 595, cy: 270, r: 12, count: 124, sent: 67 },
  { id: "mlk", name: "Maluku", cx: 700, cy: 245, r: 14, count: 98, sent: 62 },
  { id: "mlu", name: "Maluku Utara", cx: 700, cy: 195, r: 12, count: 76, sent: 69 },
  { id: "ppb", name: "Papua Barat", cx: 760, cy: 235, r: 14, count: 87, sent: 58 },
  { id: "ppa", name: "Papua", cx: 830, cy: 265, r: 18, count: 134, sent: 61 },
];

const sentColor = (s: number) =>
  s >= 75 ? "oklch(0.78 0.2 150)" : s >= 60 ? "oklch(0.78 0.18 195)" : s >= 45 ? "oklch(0.82 0.16 85)" : "oklch(0.65 0.24 22)";

const topProvinces = [...regions].sort((a, b) => b.count - a.count).slice(0, 6);

function Page() {
  return (
    <PageShell
      eyebrow="Geographic Intelligence"
      title="Peta Indonesia"
      description="Distribusi sentiment & volume berita per provinsi — visualisasi geografis pulse media nasional."
      actions={
        <>
          <select className="rounded-lg border border-border bg-panel px-3 py-2 text-xs text-foreground">
            <option>Semua Sentiment</option>
            <option>Positif</option>
            <option>Negatif</option>
            <option>Netral</option>
          </select>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-4 py-2 text-xs font-semibold text-background">
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Provinsi Terpantau" value="34" delta="100% coverage" deltaTone="up" icon={<MapPin className="h-5 w-5" />} accent="cyan" />
        <MetricCard label="Hotspot Sentimen" value="DKI" delta="1,247 mentions" deltaTone="up" icon={<TrendingUp className="h-5 w-5" />} accent="amber" hint="Highest activity" />
        <MetricCard label="Avg Sentiment" value="68%" delta="+3.4%" deltaTone="up" icon={<Activity className="h-5 w-5" />} accent="success" />
        <MetricCard label="Most Positive" value="Bali" delta="84% positif" deltaTone="up" icon={<MapPin className="h-5 w-5" />} accent="violet" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Sentiment Map — 34 Provinsi"
          icon={<MapIcon className="h-4 w-4" />}
          action={
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Positive</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan" /> Neutral+</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Mixed</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Negative</span>
            </div>
          }
        >
          <div className="relative overflow-hidden rounded-xl border border-border bg-[oklch(0.12_0.025_252)]">
            <div className="bg-grid absolute inset-0 opacity-30" />
            <svg viewBox="0 0 900 450" className="relative w-full">
              <defs>
                <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="oklch(0.78 0.18 195)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="oklch(0.78 0.18 195)" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Stylized archipelago outline */}
              <g fill="oklch(0.22 0.04 252)" stroke="oklch(0.35 0.05 252)" strokeWidth="1">
                {/* Sumatera */}
                <path d="M 75 95 Q 100 90 130 130 L 170 180 Q 200 220 240 270 L 280 305 L 295 320 L 280 325 L 240 295 Q 200 245 165 200 L 130 155 Q 100 125 75 110 Z" />
                {/* Java */}
                <path d="M 290 295 Q 340 290 400 295 Q 460 295 510 305 L 540 320 L 510 325 Q 460 320 400 320 Q 340 320 290 320 Z" />
                {/* Bali + NTB + NTT */}
                <ellipse cx="530" cy="332" rx="14" ry="6" />
                <ellipse cx="580" cy="328" rx="16" ry="6" />
                <ellipse cx="640" cy="343" rx="22" ry="7" />
                {/* Kalimantan */}
                <path d="M 305 145 Q 360 130 430 145 L 470 175 Q 480 220 460 260 L 410 270 L 360 250 Q 320 215 305 175 Z" />
                {/* Sulawesi */}
                <path d="M 555 165 Q 590 175 605 200 L 595 235 L 615 255 L 600 285 L 565 285 L 555 245 L 545 215 Z" />
                {/* Maluku */}
                <ellipse cx="700" cy="220" rx="14" ry="35" />
                {/* Papua */}
                <path d="M 740 225 Q 800 220 880 250 L 870 285 Q 800 290 740 280 Z" />
              </g>

              {regions.map((r) => (
                <g key={r.id} className="cursor-pointer">
                  <circle cx={r.cx} cy={r.cy} r={r.r + 6} fill="url(#pulse)" />
                  <circle
                    cx={r.cx}
                    cy={r.cy}
                    r={r.r}
                    fill={sentColor(r.sent)}
                    fillOpacity={0.35}
                    stroke={sentColor(r.sent)}
                    strokeWidth={1.5}
                  />
                  <circle cx={r.cx} cy={r.cy} r={3} fill={sentColor(r.sent)} />
                  <text x={r.cx} y={r.cy + r.r + 11} textAnchor="middle" className="fill-foreground" fontSize="9" fontFamily="monospace">
                    {r.name}
                  </text>
                </g>
              ))}
            </svg>
            <div className="absolute right-3 top-3 rounded-lg border border-border bg-background/80 p-2 backdrop-blur">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Total Mentions</p>
              <p className="font-display text-lg font-bold text-primary">8,492</p>
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Top Provinsi" icon={<TrendingUp className="h-4 w-4" />}>
            <ul className="space-y-3">
              {topProvinces.map((p, i) => (
                <li key={p.id} className="rounded-lg border border-border bg-panel-elevated p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-sm font-semibold text-foreground">{p.name}</span>
                    </div>
                    <Pill tone={p.sent >= 70 ? "positive" : p.sent >= 55 ? "info" : "warning"}>{p.sent}%</Pill>
                  </div>
                  <div className="mt-2">
                    <Bar label={`${p.count} mentions`} value={Math.min(100, (p.count / 1247) * 100)} color="primary" />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Regional Insight" icon={<Activity className="h-4 w-4" />}>
            <div className="space-y-3">
              <div className="rounded-lg bg-success/10 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-success">Highest Sentiment</p>
                <p className="mt-1 font-display text-sm font-bold text-foreground">Bali — 84% positif</p>
                <p className="mt-1 text-xs text-muted-foreground">Pariwisata & ekonomi kreatif memimpin sentimen positif.</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-warning">Volume Spike</p>
                <p className="mt-1 font-display text-sm font-bold text-foreground">DKI Jakarta — +47%</p>
                <p className="mt-1 text-xs text-muted-foreground">Lonjakan diskusi terkait kebijakan transportasi.</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-destructive">Risk Region</p>
                <p className="mt-1 font-display text-sm font-bold text-foreground">Papua Barat — 58%</p>
                <p className="mt-1 text-xs text-muted-foreground">Sentiment menurun, perlu perhatian khusus.</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
