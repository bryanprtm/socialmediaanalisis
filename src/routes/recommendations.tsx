import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { Target, CheckCircle2, TrendingUp, Lightbulb, AlertTriangle, Database } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";

export const Route = createFileRoute("/recommendations")({
  head: () => ({ meta: [{ title: "Action Recommendations — PROPAM" }, { name: "description", content: "Rekomendasi berbasis data news database." }] }),
  component: Page,
});

function Page() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);

  // Rule-based recommendations from real data
  const recs: { title: string; desc: string; priority: "high" | "medium" | "low"; icon: typeof Lightbulb }[] = [];
  if (s.pctNeg > 30) recs.push({ priority: "high", icon: AlertTriangle, title: `Sentiment negatif tinggi (${s.pctNeg}%)`, desc: `Terdapat ${s.neg} artikel dengan sentiment negatif. Pertimbangkan komunikasi tanggapan & monitoring intensif.` });
  if (s.pctPos > 60) recs.push({ priority: "low", icon: TrendingUp, title: `Sentiment positif kuat (${s.pctPos}%)`, desc: `Momentum positif baik (${s.pos} artikel). Manfaatkan untuk amplifikasi kampanye terkait.` });
  for (const k of s.keywords.slice(0, 3)) {
    recs.push({ priority: "medium", icon: Lightbulb, title: `Fokus pada topik "${k.name}"`, desc: `${k.count} mentions terindeks. Buat konten mendalam atau respons resmi untuk maksimalkan visibilitas.` });
  }
  for (const src of s.sources.slice(0, 2)) {
    recs.push({ priority: "medium", icon: Target, title: `Engagement dengan ${src.name}`, desc: `Sumber dengan ${src.count} artikel terbanyak. Pertimbangkan media engagement & klarifikasi langsung.` });
  }
  if (s.total === 0 && !active) {
    recs.push({ priority: "high", icon: Database, title: "Database masih kosong", desc: "Tambahkan berita manual atau aktifkan RSS feed agar rekomendasi dapat dihasilkan." });
  }

  return (
    <PageShell eyebrow="Strategy" title="Rekomendasi Aksi" description="Rekomendasi dihasilkan otomatis dari distribusi data news database. Disaring oleh kata kunci aktif.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Rekomendasi" value={String(recs.length)} accent="cyan" icon={<Target className="h-5 w-5" />} />
        <MetricCard label="High Priority" value={String(recs.filter((r) => r.priority === "high").length)} accent="danger" icon={<AlertTriangle className="h-5 w-5" />} />
        <MetricCard label="Medium" value={String(recs.filter((r) => r.priority === "medium").length)} accent="amber" icon={<Lightbulb className="h-5 w-5" />} />
        <MetricCard label="Low" value={String(recs.filter((r) => r.priority === "low").length)} accent="success" icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p> : recs.length === 0 ? (
          <Panel>
            <div className="py-10 text-center text-sm text-muted-foreground">
              Belum ada rekomendasi yang dapat dihasilkan. Tambahkan lebih banyak data berita di{" "}
              <Link to="/news" className="text-primary hover:underline">News Database</Link>.
            </div>
          </Panel>
        ) : (
          recs.map((r, i) => {
            const I = r.icon;
            return (
              <Panel key={i} title={<div className="flex items-center gap-2"><I className="h-4 w-4 text-primary" /> {r.title}</div>} action={<Pill tone={r.priority === "high" ? "negative" : r.priority === "medium" ? "warning" : "positive"}>{r.priority}</Pill>}>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </Panel>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
