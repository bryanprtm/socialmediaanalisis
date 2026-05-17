import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { ResponsiveContainer, BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Globe, FileText, TrendingUp, ExternalLink, KeyRound, Sparkles } from "lucide-react";
import { useActiveKeyword } from "@/hooks/use-active-keyword";
import { evalExpression } from "@/lib/keyword-query";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search & Monitoring — PROPAM" },
      { name: "description", content: "Pencarian berita & monitoring keyword real-time dengan filter advanced." },
    ],
  }),
  component: Page,
});

const sentimentBars = [
  { d: "Sen", positif: 45, negatif: 18, netral: 22 },
  { d: "Sel", positif: 52, negatif: 15, netral: 28 },
  { d: "Rab", positif: 38, negatif: 24, netral: 19 },
  { d: "Kam", positif: 61, negatif: 12, netral: 31 },
  { d: "Jum", positif: 48, negatif: 20, netral: 25 },
  { d: "Sab", positif: 55, negatif: 16, netral: 29 },
  { d: "Min", positif: 42, negatif: 22, netral: 18 },
];

const results = [
  {
    title: "Pemerintah Tingkatkan Anggaran Kesehatan 2024",
    src: "Kompas.com",
    cat: "Kesehatan",
    sent: "positive" as const,
    sentLabel: "Positif",
    score: 0.78,
    time: "2 jam lalu",
    excerpt: "Kementerian Kesehatan mengumumkan peningkatan anggaran sebesar 15% untuk program vaksinasi nasional dan pembangunan rumah sakit di daerah terpencil.",
  },
  {
    title: "Kontroversi Kebijakan Subsidi BBM Memanas",
    src: "Detik.com",
    cat: "Ekonomi",
    sent: "negative" as const,
    sentLabel: "Negatif",
    score: 0.34,
    time: "4 jam lalu",
    excerpt: "Rencana pencabutan subsidi BBM bersubsidi memicu protes dari berbagai kalangan masyarakat dan elemen mahasiswa di beberapa kota besar.",
  },
  {
    title: "Inovasi Startup Indonesia Raih Pendanaan Internasional",
    src: "CNN Indonesia",
    cat: "Teknologi",
    sent: "positive" as const,
    sentLabel: "Positif",
    score: 0.86,
    time: "6 jam lalu",
    excerpt: "Tiga startup teknologi asal Indonesia berhasil meraih pendanaan Series B dengan total nilai mencapai 120 juta USD dari investor global.",
  },
  {
    title: "Update Regulasi Investasi Asing Diluncurkan",
    src: "Tempo.co",
    cat: "Politik",
    sent: "neutral" as const,
    sentLabel: "Netral",
    score: 0.51,
    time: "8 jam lalu",
    excerpt: "Pemerintah merilis paket regulasi baru terkait investasi asing langsung yang diharapkan mempermudah masuknya modal ke sektor manufaktur.",
  },
];

const sources = [
  { n: "Kompas.com", c: 847, p: 95 },
  { n: "Detik.com", c: 623, p: 88 },
  { n: "CNN Indonesia", c: 412, p: 91 },
  { n: "Tempo.co", c: 289, p: 84 },
  { n: "Antara News", c: 198, p: 79 },
];

function Page() {
  const { active } = useActiveKeyword();
  const filteredResults = active
    ? results.filter((r) => evalExpression(active.expression, [r.title, r.excerpt, r.src, r.cat].join(" ")))
    : results;
  const filteredSources = active
    ? sources.filter((s) => evalExpression(active.expression, s.n))
    : sources;
  return (
    <PageShell
      eyebrow="Search Intelligence"
      title="Pencarian & Monitoring"
      description="Hasil pencarian disaring berdasarkan kata kunci aktif. Kelola kata kunci di halaman Kata Kunci Pencarian."
    >
      <Panel>
        {active ? (
          <div className="flex flex-wrap items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Query aktif:</span>
            <span className="text-sm text-foreground">{active.name}</span>
            <code className="rounded-md border border-primary/30 bg-panel-elevated px-2 py-0.5 font-mono text-xs text-primary">
              {active.expression}
            </code>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {filteredResults.length} hasil cocok
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Belum ada kata kunci aktif. Pilih query di dropdown TopNav atau{" "}
              <Link to="/keywords" className="text-primary hover:underline">tambahkan di halaman Kata Kunci →</Link>
            </p>
          </div>
        )}
      </Panel>


      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Hasil Ditemukan" value="2,369" delta="+18%" deltaTone="up" icon={<FileText className="h-5 w-5" />} accent="cyan" />
        <MetricCard label="Sumber Aktif" value="42" delta="+5 baru" deltaTone="up" icon={<Globe className="h-5 w-5" />} accent="violet" />
        <MetricCard label="Sentiment Score" value="72%" delta="+4.1%" deltaTone="up" icon={<TrendingUp className="h-5 w-5" />} accent="success" />
        <MetricCard label="Avg Confidence" value="0.89" hint="ML model rating" icon={<TrendingUp className="h-5 w-5" />} accent="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Distribusi Sentiment 7 Hari" icon={<TrendingUp className="h-4 w-4" />} action={<Pill tone="info">7d</Pill>}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="d" stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.025 240)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 252)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <RBar dataKey="positif" stackId="a" fill="oklch(0.78 0.2 150)" radius={[0, 0, 0, 0]} />
                <RBar dataKey="netral" stackId="a" fill="oklch(0.65 0.02 240)" />
                <RBar dataKey="negatif" stackId="a" fill="oklch(0.65 0.24 22)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top Sumber" icon={<Globe className="h-4 w-4" />}>
          <ul className="space-y-3">
            {sources.map((s) => (
              <li key={s.n} className="rounded-lg border border-border bg-panel-elevated p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{s.n}</span>
                  <span className="font-mono text-xs font-bold text-primary">{s.c}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-cyan" style={{ width: `${s.p}%` }} />
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Performance {s.p}%</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-6" title="Hasil Pencarian" icon={<FileText className="h-4 w-4" />} action={<span className="font-mono text-xs text-muted-foreground">Showing 4 of 2,369</span>}>
        <ul className="divide-y divide-border">
          {results.map((r) => (
            <li key={r.title} className="group py-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4">
                <div className="hidden sm:block">
                  <div className="rounded-lg border border-border bg-panel-elevated p-2.5">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary">{r.title}</h3>
                    <div className="flex items-center gap-2">
                      <Pill tone={r.sent === "positive" ? "positive" : r.sent === "negative" ? "negative" : "neutral"}>{r.sentLabel}</Pill>
                      <span className="font-mono text-xs text-muted-foreground">{r.score.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.excerpt}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                    <span className="text-primary">{r.src}</span>
                    <span>·</span>
                    <Pill tone="info">{r.cat}</Pill>
                    <span>· ⏱ {r.time}</span>
                    <button className="ml-auto inline-flex items-center gap-1 text-primary hover:underline">
                      Read Source <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </PageShell>
  );
}
