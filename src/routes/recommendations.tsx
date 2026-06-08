import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { Target, CheckCircle2, TrendingUp, Lightbulb, AlertTriangle, Database, Flame, Newspaper, ShieldAlert } from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";
import { AINarrative } from "@/components/AINarrative";

export const Route = createFileRoute("/recommendations")({
  head: () => ({ meta: [{ title: "Action Recommendations — TOC Sat Bantek" }, { name: "description", content: "Rekomendasi berbasis data news database." }] }),
  component: Page,
});

type Rec = {
  title: string;
  desc: string;
  priority: "high" | "medium" | "low";
  icon: typeof Lightbulb;
};

function Page() {
  const { filtered, loading, active } = useFilteredArticles();
  const s = summarize(filtered);

  // Compute additional intel for richer recommendations
  const now = Date.now();
  const last24h = filtered.filter((a) => a.published_at && now - new Date(a.published_at).getTime() <= 86400000);
  const prev24h = filtered.filter((a) => a.published_at && now - new Date(a.published_at).getTime() > 86400000 && now - new Date(a.published_at).getTime() <= 172800000);
  const velocity = prev24h.length > 0 ? Math.round(((last24h.length - prev24h.length) / prev24h.length) * 100) : last24h.length > 0 ? 100 : 0;
  const negLast24 = last24h.filter((a) => a.sentiment === "negative").length;
  const negShareLast24 = last24h.length ? Math.round((negLast24 / last24h.length) * 100) : 0;

  const recs: Rec[] = [];

  // Sentiment-based
  if (s.pctNeg >= 40) {
    recs.push({
      priority: "high",
      icon: ShieldAlert,
      title: `Krisis sentiment negatif (${s.pctNeg}%)`,
      desc: `Distribusi negatif mencapai ${s.pctNeg}% dari total ${s.total} artikel (${s.neg} artikel negatif). Tingkat ini berada di zona krisis yang berpotensi merusak reputasi dalam jangka pendek. Aktifkan war-room komunikasi, susun siaran pers klarifikasi resmi dalam 24 jam, lakukan monitoring real-time setiap jam, dan tunjuk juru bicara tunggal untuk pesan yang konsisten. Identifikasi 3 narasi negatif paling dominan lalu siapkan counter-narrative berbasis fakta.`,
    });
  } else if (s.pctNeg >= 25) {
    recs.push({
      priority: "high",
      icon: AlertTriangle,
      title: `Sentiment negatif perlu perhatian (${s.pctNeg}%)`,
      desc: `Terdapat ${s.neg} artikel negatif (${s.pctNeg}%) yang masih dalam ambang waspada. Lakukan analisis akar masalah pada keyword & sumber dominan, siapkan talking points untuk humas, dan tingkatkan frekuensi konten positif yang berimbang. Pantau perkembangan setiap 6 jam.`,
    });
  }
  if (s.pctPos >= 60) {
    recs.push({
      priority: "low",
      icon: TrendingUp,
      title: `Momentum positif kuat (${s.pctPos}%)`,
      desc: `Sentiment positif mencapai ${s.pctPos}% (${s.pos} artikel). Manfaatkan momentum ini untuk amplifikasi: re-publikasi highlight ke kanal sosial, kemas menjadi success-story, libatkan KOL relevan, dan dokumentasikan sebagai bahan laporan eksekutif. Pertahankan ritme rilis informasi positif minimal 2x sehari.`,
    });
  }

  // Velocity / volume
  if (velocity >= 50) {
    recs.push({
      priority: "high",
      icon: Flame,
      title: `Lonjakan volume pemberitaan (+${velocity}%)`,
      desc: `Volume 24 jam terakhir (${last24h.length} artikel) naik ${velocity}% dibanding hari sebelumnya (${prev24h.length}). Ini mengindikasikan isu sedang viral. Lakukan pemetaan cepat: topik pemicu, sumber paling produktif, dan sentiment dominan. Siapkan respons proaktif sebelum siklus berita berikutnya.`,
    });
  }
  if (negShareLast24 >= 40 && last24h.length >= 5) {
    recs.push({
      priority: "high",
      icon: AlertTriangle,
      title: `Sentiment negatif harian memburuk (${negShareLast24}%)`,
      desc: `Dari ${last24h.length} artikel dalam 24 jam terakhir, ${negLast24} (${negShareLast24}%) bersentiment negatif. Eskalasi ke pimpinan, aktifkan crisis-comm SOP, dan siapkan klarifikasi resmi untuk dirilis dalam siklus berita berikutnya.`,
    });
  }

  // Top topics — richer narrative
  for (const k of s.keywords.slice(0, 5)) {
    const items = filtered.filter((a) => (a.keywords ?? []).includes(k.name));
    const pos = items.filter((a) => a.sentiment === "positive").length;
    const neg = items.filter((a) => a.sentiment === "negative").length;
    const dominant = neg > pos ? "negatif" : pos > neg ? "positif" : "netral";
    const priority: Rec["priority"] = neg > pos && items.length >= 5 ? "high" : "medium";
    recs.push({
      priority,
      icon: Lightbulb,
      title: `Topik dominan: "${k.name}" (${k.count} mentions)`,
      desc: `Topik "${k.name}" muncul ${k.count} kali dengan sentiment dominan ${dominant} (positif ${pos}, negatif ${neg}). ${
        dominant === "negatif"
          ? "Susun narasi tandingan berbasis data, sediakan FAQ resmi, dan distribusikan ke media partner. Pertimbangkan press-briefing terfokus."
          : dominant === "positif"
            ? "Perkuat narasi positif melalui konten mendalam, infografis, dan video pendek untuk memperluas jangkauan."
            : "Susun konten edukatif untuk mengarahkan persepsi publik ke arah yang konstruktif."
      }`,
    });
  }

  // Top sources engagement
  for (const src of s.sources.slice(0, 3)) {
    const items = filtered.filter((a) => a.source === src.name);
    const neg = items.filter((a) => a.sentiment === "negative").length;
    const negPct = items.length ? Math.round((neg / items.length) * 100) : 0;
    const priority: Rec["priority"] = negPct >= 40 ? "high" : "medium";
    recs.push({
      priority,
      icon: Newspaper,
      title: `Engagement dengan ${src.name}`,
      desc: `${src.name} merilis ${src.count} artikel terkait isu yang dipantau (sentiment negatif ${negPct}%). ${
        negPct >= 40
          ? "Prioritaskan media engagement langsung: jadwalkan media visit, sediakan akses narasumber resmi, dan tawarkan eksklusif data/insight agar pemberitaan lebih berimbang."
          : "Pertahankan relasi yang sudah baik melalui pengiriman release berkala dan undangan ke acara resmi."
      }`,
    });
  }

  // Region focus
  if (s.regions.length > 0) {
    const top = s.regions[0];
    recs.push({
      priority: "medium",
      icon: Target,
      title: `Fokus regional: ${top.name}`,
      desc: `Wilayah ${top.name} menyumbang ${top.count} artikel terbanyak. Koordinasikan dengan unit di daerah untuk respons lokal, gunakan bahasa & konteks lokal pada materi komunikasi, dan tingkatkan visibilitas kegiatan unit setempat.`,
    });
  }

  // Empty state
  if (s.total === 0 && !active) {
    recs.push({
      priority: "high",
      icon: Database,
      title: "Database masih kosong",
      desc: "Belum ada artikel yang terindeks. Aktifkan RSS feed di halaman RSS Manager atau tambahkan artikel secara manual di News Database agar sistem dapat menghasilkan rekomendasi yang akurat.",
    });
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
                <p className="text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
              </Panel>
            );
          })
        )}
      </div>

      <AINarrative
        className="mt-6"
        page="Rekomendasi Aksi"
        context={{
          total_artikel: s.total,
          distribusi_sentiment: { positif: s.pctPos, negatif: s.pctNeg, netral: s.pctNeu },
          velocity_24h_persen: velocity,
          negatif_24h_persen: negShareLast24,
          top_keywords: s.keywords.slice(0, 8).map((k) => `${k.name}(${k.count})`),
          top_sumber: s.sources.slice(0, 5).map((src) => `${src.name}(${src.count})`),
          rekomendasi_rule_based: recs.map((r) => `[${r.priority}] ${r.title}`),
          filter_aktif: active?.name ?? null,
        }}
      />
    </PageShell>
  );
}
