import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { FileBarChart, Download, MessageCircle, Mail, FileText, Calendar, CheckCircle2, Clock, Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "Export Report — PROPAM" },
      { name: "description", content: "Generate dan kirim laporan analitik ke WhatsApp, Email, atau download PDF." },
    ],
  }),
  component: Page,
});

const templates = [
  { id: "daily", name: "Daily Brief", desc: "Ringkasan harian sentimen & top stories", icon: Calendar, accent: "cyan" as const, time: "5 min" },
  { id: "weekly", name: "Weekly Intelligence", desc: "Analisis mendalam mingguan + tren topik", icon: FileBarChart, accent: "violet" as const, time: "15 min" },
  { id: "monthly", name: "Monthly Executive", desc: "Laporan eksekutif bulanan + rekomendasi AI", icon: Sparkles, accent: "amber" as const, time: "30 min" },
  { id: "custom", name: "Custom Report", desc: "Konfigurasi sendiri rentang & seksi", icon: FileText, accent: "success" as const, time: "Variable" },
];

const sections = [
  { id: "exec", name: "Executive Summary", checked: true },
  { id: "metric", name: "Key Metrics & KPI", checked: true },
  { id: "sent", name: "Sentiment Distribution", checked: true },
  { id: "topic", name: "Top Topics & Trends", checked: true },
  { id: "media", name: "Media Source Analysis", checked: true },
  { id: "sna", name: "SNA Network Map", checked: false },
  { id: "geo", name: "Geographic Heatmap", checked: true },
  { id: "pred", name: "ML Predictions", checked: false },
  { id: "rec", name: "AI Recommendations", checked: true },
  { id: "raw", name: "Raw Article List (Appendix)", checked: false },
];

const history = [
  { name: "Daily Brief — 19 Apr 2026", channel: "WhatsApp", recipients: 12, status: "delivered" as const, time: "08:00", size: "847 KB" },
  { name: "Weekly Intelligence — Week 16", channel: "Email", recipients: 28, status: "delivered" as const, time: "Yesterday", size: "3.2 MB" },
  { name: "Monthly Executive — Mar 2026", channel: "Email + PDF", recipients: 8, status: "delivered" as const, time: "01 Apr", size: "8.4 MB" },
  { name: "Custom — Pilkada Coverage", channel: "WhatsApp", recipients: 24, status: "scheduled" as const, time: "Tomorrow 09:00", size: "1.4 MB" },
  { name: "Daily Brief — 18 Apr 2026", channel: "WhatsApp", recipients: 12, status: "failed" as const, time: "08:02", size: "—" },
];

function Page() {
  return (
    <PageShell
      eyebrow="Distribution Hub"
      title="Export & Report"
      description="Generate laporan profesional dan distribusikan ke WhatsApp, Email, atau download sebagai PDF."
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40">
            <Clock className="h-3.5 w-3.5" /> Schedule
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-4 py-2 text-xs font-semibold text-background">
            <Send className="h-3.5 w-3.5" /> Generate Now
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Reports Generated" value="247" delta="+18 bulan ini" deltaTone="up" icon={<FileBarChart className="h-5 w-5" />} accent="cyan" />
        <MetricCard label="Total Recipients" value="142" delta="across 24 grup" deltaTone="up" icon={<MessageCircle className="h-5 w-5" />} accent="success" />
        <MetricCard label="Delivery Rate" value="98.7%" delta="+0.3%" deltaTone="up" icon={<CheckCircle2 className="h-5 w-5" />} accent="violet" hint="Last 30 days" />
        <MetricCard label="Avg Generation" value="12s" hint="ML + render time" icon={<Sparkles className="h-5 w-5" />} accent="amber" />
      </div>

      <Panel className="mt-6" title="Pilih Template Laporan" icon={<FileBarChart className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t, i) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                  i === 0 ? "border-primary/60 bg-primary/5 shadow-[0_0_24px_-12px_oklch(0.78_0.18_195_/_0.6)]" : "border-border bg-panel-elevated hover:border-primary/40"
                }`}
              >
                {i === 0 && <span className="absolute right-3 top-3"><CheckCircle2 className="h-4 w-4 text-primary" /></span>}
                <div className={`inline-flex rounded-lg p-2.5 ${t.accent === "cyan" ? "bg-cyan/15 text-cyan" : t.accent === "violet" ? "bg-violet/15 text-violet" : t.accent === "amber" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-sm font-bold text-foreground">{t.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">⏱ {t.time}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Select →</span>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Konfigurasi Konten" icon={<FileText className="h-4 w-4" />}>
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Section yang Disertakan</p>
              <ul className="mt-2 space-y-1.5">
                {sections.map((s) => (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-panel-elevated px-3 py-2 hover:border-primary/40">
                      <span className="text-sm text-foreground">{s.name}</span>
                      <input
                        type="checkbox"
                        defaultChecked={s.checked}
                        className="h-4 w-4 rounded border-border bg-background accent-[oklch(0.78_0.18_195)]"
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Rentang Waktu</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input type="date" className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none" />
                  <input type="date" className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none" />
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Format Output</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["PDF", "Excel", "JSON"].map((f, i) => (
                    <button
                      key={f}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                        i === 0 ? "border-primary/60 bg-primary/15 text-primary" : "border-border bg-panel-elevated text-foreground hover:border-primary/40"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Channel Distribusi</p>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-foreground"><MessageCircle className="h-4 w-4 text-success" /> WhatsApp Group (12)</span>
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border accent-[oklch(0.78_0.2_150)]" />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-foreground"><Mail className="h-4 w-4 text-primary" /> Email List (28)</span>
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border accent-[oklch(0.78_0.18_195)]" />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-foreground"><Download className="h-4 w-4 text-violet" /> Download Only</span>
                    <input type="checkbox" className="h-4 w-4 rounded border-border accent-[oklch(0.7_0.18_295)]" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
            <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-panel-elevated px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40">
              <FileText className="h-4 w-4" /> Preview
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-cyan px-5 py-2.5 text-sm font-semibold text-background shadow-[0_0_24px_-8px_oklch(0.78_0.18_195_/_0.7)]">
              <Send className="h-4 w-4" /> Generate & Distribute
            </button>
          </div>
        </Panel>

        <Panel title="Live Preview" icon={<Sparkles className="h-4 w-4" />}>
          <div className="overflow-hidden rounded-lg border border-border bg-[oklch(0.98_0_0)] p-4 text-[oklch(0.2_0.02_252)]">
            <div className="border-b border-[oklch(0.85_0_0)] pb-2">
              <p className="font-display text-[10px] font-bold uppercase tracking-wider text-[oklch(0.65_0.24_22)]">PROPAM — Daily Brief</p>
              <p className="font-display text-base font-bold">19 April 2026</p>
            </div>
            <div className="mt-3 space-y-2 text-[10px]">
              <div>
                <p className="font-mono uppercase opacity-60">Executive Summary</p>
                <p>Sentiment positif meningkat 5.2% dengan 2,847 artikel terpantau dari 24 portal aktif…</p>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="rounded bg-[oklch(0.95_0_0)] p-1.5 text-center"><p className="font-bold">68%</p><p className="opacity-60">POS</p></div>
                <div className="rounded bg-[oklch(0.95_0_0)] p-1.5 text-center"><p className="font-bold">22%</p><p className="opacity-60">NET</p></div>
                <div className="rounded bg-[oklch(0.95_0_0)] p-1.5 text-center"><p className="font-bold">10%</p><p className="opacity-60">NEG</p></div>
              </div>
              <div>
                <p className="font-mono uppercase opacity-60">Top 3 Topics</p>
                <p>1. Kebijakan Ekonomi · 2. Vaksinasi · 3. IKN</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
            <span>Pages: ~12</span>
            <span>Est. size: 1.2 MB</span>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6" title="Riwayat Pengiriman" icon={<Clock className="h-4 w-4" />} action={<Pill tone="positive">98.7% delivered</Pill>}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-2 py-2 font-medium">Report</th>
                <th className="px-2 py-2 font-medium">Channel</th>
                <th className="px-2 py-2 font-medium">Recipients</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Time</th>
                <th className="px-2 py-2 font-medium">Size</th>
                <th className="px-2 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((h) => (
                <tr key={h.name + h.time} className="text-sm hover:bg-panel-elevated">
                  <td className="px-2 py-3 font-semibold text-foreground">{h.name}</td>
                  <td className="px-2 py-3 font-mono text-xs text-muted-foreground">{h.channel}</td>
                  <td className="px-2 py-3 font-mono text-xs text-foreground">{h.recipients}</td>
                  <td className="px-2 py-3">
                    <Pill tone={h.status === "delivered" ? "positive" : h.status === "scheduled" ? "info" : "negative"}>
                      {h.status}
                    </Pill>
                  </td>
                  <td className="px-2 py-3 font-mono text-xs text-muted-foreground">{h.time}</td>
                  <td className="px-2 py-3 font-mono text-xs text-muted-foreground">{h.size}</td>
                  <td className="px-2 py-3">
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" aria-label="download">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageShell>
  );
}
