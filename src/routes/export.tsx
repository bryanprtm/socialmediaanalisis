import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import {
  FileBarChart,
  Download,
  MessageCircle,
  Mail,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useFilteredArticles, summarize } from "@/hooks/use-filtered-articles";
import { generateWhatsAppReport } from "@/lib/whatsapp-report.functions";
import { generatePptStructure, type PptSlidesPayload } from "@/lib/ppt-report.functions";

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "Export Report — TOC Sat Bantek" },
      { name: "description", content: "Generate dan kirim laporan analitik ke WhatsApp, Email, atau download PDF." },
    ],
  }),
  component: Page,
});

const templates = [
  { id: "daily", name: "Daily Brief", desc: "Ringkasan harian sentimen & top stories", icon: Calendar, accent: "cyan" as const, time: "5 min", periode: "Harian" },
  { id: "weekly", name: "Weekly Intelligence", desc: "Analisis mendalam mingguan + tren topik", icon: FileBarChart, accent: "violet" as const, time: "15 min", periode: "Mingguan" },
  { id: "monthly", name: "Monthly Executive", desc: "Laporan eksekutif bulanan + rekomendasi AI", icon: Sparkles, accent: "amber" as const, time: "30 min", periode: "Bulanan" },
  { id: "custom", name: "Custom Report", desc: "Konfigurasi sendiri rentang & seksi", icon: FileText, accent: "success" as const, time: "Variable", periode: "Kustom" },
];

function Page() {
  const { filtered, active, loading } = useFilteredArticles();
  const s = summarize(filtered);
  const genFn = useServerFn(generateWhatsAppReport);
  const pptFn = useServerFn(generatePptStructure);
  const [templateId, setTemplateId] = useState<string>("daily");
  const [report, setReport] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [generatingPpt, setGeneratingPpt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute trend windows (last 7 historical)
  const now = Date.now();
  const historis7Hari = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - 6 + i);
    const start = day.getTime();
    const end = start + 86400000;
    return filtered.filter(
      (a) => a.published_at && new Date(a.published_at).getTime() >= start && new Date(a.published_at).getTime() < end,
    ).length;
  });
  const sumY = historis7Hari.reduce((a, b) => a + b, 0);
  const xs = historis7Hari.map((_, i) => i);
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumXY = historis7Hari.reduce((a, y, i) => a + y * i, 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const proyeksi7Hari = Array.from({ length: 7 }, (_, i) => Math.max(0, Math.round(intercept + slope * (7 + i))));

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setCopied(false);
    try {
      const tpl = templates.find((t) => t.id === templateId) ?? templates[0];
      const r = await genFn({
        data: {
          periode: tpl.periode,
          total: s.total,
          positif: s.pos,
          negatif: s.neg,
          netral: s.neu,
          pctPos: s.pctPos,
          pctNeg: s.pctNeg,
          pctNeu: s.pctNeu,
          topKeywords: s.keywords.slice(0, 10),
          topSources: s.sources.slice(0, 10),
          topCategories: s.categories.slice(0, 8),
          topRegions: s.regions.slice(0, 8),
          historis7Hari,
          proyeksi7Hari,
          filterAktif: active?.name ?? null,
        },
      });
      setReport(r.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat laporan");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadTxt() {
    if (!report) return;
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-toc-sat-bantek-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadPdf() {
    if (!report) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 56; // ~0.78"
    const maxWidth = pageWidth - margin * 2;
    const tpl = templates.find((t) => t.id === templateId) ?? templates[0];
    const tanggal = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const waktu = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Strip emoji & simbol non-latin agar tidak jadi kotak di helvetica
    const clean = (t: string) =>
      t
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/gu, "")
        .replace(/[•●▪◆■►▶▸◦·]/g, "-")
        .replace(/[—–]/g, "-")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .trimEnd();

    let y = margin;

    // ===== HEADER / KOP =====
    doc.setFillColor(15, 42, 66);
    doc.rect(0, 0, pageWidth, 90, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LAPORAN INTELIJEN MEDIA", margin, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("TOC Sat Bantek — Media Monitoring & Sentiment Analysis", margin, 56);
    doc.setFontSize(9);
    doc.text(`${tpl.name.toUpperCase()}  |  ${tanggal}  |  ${waktu} WIB`, margin, 72);

    // garis aksen
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(2);
    doc.line(margin, 86, pageWidth - margin, 86);

    doc.setTextColor(20, 20, 20);
    y = 120;

    // ===== META BOX =====
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 249, 251);
    doc.roundedRect(margin, y, maxWidth, 56, 4, 4, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text("PERIODE", margin + 14, y + 18);
    doc.text("TEMPLATE", margin + 14 + maxWidth / 3, y + 18);
    doc.text("FILTER AKTIF", margin + 14 + (maxWidth / 3) * 2, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(tpl.periode, margin + 14, y + 38);
    doc.text(tpl.name, margin + 14 + maxWidth / 3, y + 38);
    doc.text(active?.name ?? "Semua data", margin + 14 + (maxWidth / 3) * 2, y + 38);
    y += 76;

    // ===== BODY =====
    const lineHeight = 14;
    const sectionHeadingSize = 12;
    const bodySize = 10.5;

    const ensureSpace = (need: number) => {
      if (y + need > pageHeight - margin - 30) {
        addFooter();
        doc.addPage();
        y = margin;
      }
    };

    const rawLines = report.split(/\r?\n/);
    // Heading detector: ALL CAPS line, or line ending with ":", or numbered "1. JUDUL"
    const isHeading = (raw: string) => {
      const t = raw.trim();
      if (!t) return false;
      if (/^[A-Z0-9 .\-]{6,}$/.test(t) && t === t.toUpperCase() && /[A-Z]/.test(t)) return true;
      if (/^\d+\.\s+[A-Z]/.test(t) && t.length < 80) return true;
      return false;
    };

    for (const raw of rawLines) {
      const line = clean(raw);
      if (!line.trim()) {
        y += lineHeight / 2;
        continue;
      }

      if (isHeading(line)) {
        ensureSpace(lineHeight * 2 + 8);
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(sectionHeadingSize);
        doc.setTextColor(15, 42, 66);
        doc.text(line.toUpperCase(), margin, y);
        y += 6;
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.8);
        doc.line(margin, y, margin + 60, y);
        y += 14;
        doc.setTextColor(20, 20, 20);
        continue;
      }

      // bullet?
      const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
      const isBullet = !!bulletMatch;
      const text = bulletMatch ? bulletMatch[1] : line;
      const indent = isBullet ? 18 : 0;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodySize);
      const wrapped = doc.splitTextToSize(text, maxWidth - indent) as string[];
      for (let i = 0; i < wrapped.length; i++) {
        ensureSpace(lineHeight);
        if (isBullet && i === 0) {
          doc.setFont("helvetica", "bold");
          doc.text("•", margin + 4, y);
          doc.setFont("helvetica", "normal");
        }
        doc.text(wrapped[i], margin + indent, y);
        y += lineHeight;
      }
    }

    // ===== FOOTER pada setiap halaman =====
    function addFooter() {
      const total = doc.getNumberOfPages();
      const current = doc.getCurrentPageInfo().pageNumber;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("TOC Sat Bantek — Dokumen Resmi (Internal)", margin, pageHeight - 24);
      doc.text(
        `Halaman ${current} dari ${total}`,
        pageWidth - margin,
        pageHeight - 24,
        { align: "right" },
      );
      doc.setTextColor(20, 20, 20);
    }

    // Tambahkan footer ke semua halaman
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      addFooter();
    }

    doc.save(`laporan-toc-sat-bantek-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const wahatsappUrl = report ? `https://wa.me/?text=${encodeURIComponent(report)}` : "#";

  return (
    <PageShell
      eyebrow="Distribution Hub"
      title="Export & Report"
      description="Generate laporan profesional dan distribusikan ke WhatsApp, Email, atau download sebagai file teks."
      actions={
        <button
          onClick={handleGenerate}
          disabled={generating || loading || s.total === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-4 py-2 text-xs font-semibold text-background disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Generate Now
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Artikel" value={String(s.total)} hint={active ? `Filter: ${active.name}` : "All"} icon={<FileBarChart className="h-5 w-5" />} accent="cyan" />
        <MetricCard label="Sumber Aktif" value={String(s.sources.length)} icon={<MessageCircle className="h-5 w-5" />} accent="success" />
        <MetricCard label="Sentiment Positif" value={`${s.pctPos}%`} icon={<CheckCircle2 className="h-5 w-5" />} accent="violet" hint={`${s.pos} artikel`} />
        <MetricCard label="Sentiment Negatif" value={`${s.pctNeg}%`} icon={<Sparkles className="h-5 w-5" />} accent="amber" hint={`${s.neg} artikel`} />
      </div>

      <Panel className="mt-6" title="Pilih Template Laporan" icon={<FileBarChart className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t) => {
            const Icon = t.icon;
            const selected = t.id === templateId;
            return (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                  selected ? "border-primary/60 bg-primary/5 shadow-[0_0_24px_-12px_oklch(0.78_0.18_195_/_0.6)]" : "border-border bg-panel-elevated hover:border-primary/40"
                }`}
              >
                {selected && <span className="absolute right-3 top-3"><CheckCircle2 className="h-4 w-4 text-primary" /></span>}
                <div className={`inline-flex rounded-lg p-2.5 ${t.accent === "cyan" ? "bg-cyan/15 text-cyan" : t.accent === "violet" ? "bg-violet/15 text-violet" : t.accent === "amber" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-sm font-bold text-foreground">{t.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">⏱ {t.time}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary">{selected ? "Selected" : "Pilih →"}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating || loading || s.total === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-cyan px-5 py-2.5 text-sm font-semibold text-background shadow-[0_0_24px_-8px_oklch(0.78_0.18_195_/_0.7)] disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {generating ? "Menyusun laporan…" : "Generate & Distribute"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {s.total === 0 && !loading && (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada artikel di database. Tambah berita atau aktifkan RSS feed terlebih dahulu.</p>
        )}
      </Panel>

      <Panel
        className="mt-6"
        title={<div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-success" /> Laporan WhatsApp (Teks)</div>}
        action={
          report ? (
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground hover:border-primary/40">
                <Copy className="h-3 w-3" /> {copied ? "Tersalin" : "Copy"}
              </button>
              <button onClick={handleDownloadTxt} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground hover:border-primary/40">
                <Download className="h-3 w-3" /> .txt
              </button>
              <button onClick={handleDownloadPdf} className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20">
                <Download className="h-3 w-3" /> .pdf
              </button>
              <a href={wahatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-success hover:bg-success/25">
                <ExternalLink className="h-3 w-3" /> Buka WhatsApp
              </a>
            </div>
          ) : null
        }
      >
        {report ? (
          <pre className="max-h-[560px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-panel-elevated p-4 text-xs leading-relaxed text-foreground/90">
            {report}
          </pre>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Klik <span className="font-semibold text-foreground">Generate Now</span> untuk menyusun laporan dengan format: Pendahuluan · Sumber Data · Ringkasan · Fakta · Analisis AI · Prediksi · Rekomendasi · Kesimpulan.
          </p>
        )}
      </Panel>

      <Panel className="mt-6" title="Riwayat Pengiriman" icon={<Clock className="h-4 w-4" />} action={<Pill tone="info">Lokal</Pill>}>
        <p className="py-6 text-center text-xs text-muted-foreground">
          Riwayat pengiriman otomatis akan tersedia ketika integrasi distribusi email/WhatsApp resmi diaktifkan. Saat ini laporan dapat disalin manual atau dibuka melalui tombol WhatsApp di atas.
        </p>
      </Panel>

      <Panel className="mt-6" title="Distribusi" icon={<Mail className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-foreground"><MessageCircle className="h-4 w-4 text-success" /> WhatsApp (manual)</span>
            <Pill tone="positive">Aktif</Pill>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-foreground"><Mail className="h-4 w-4 text-primary" /> Email</span>
            <Pill tone="info">Segera</Pill>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-foreground"><Download className="h-4 w-4 text-violet" /> Download .txt</span>
            <Pill tone="positive">Aktif</Pill>
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
