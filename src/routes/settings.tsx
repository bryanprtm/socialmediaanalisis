import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, Pill, Bar } from "@/components/PageShell";
import { Settings as SettingsIcon, Palette, Globe, Database, Shield, Bell, Zap, Save, RotateCcw, Cpu, HardDrive, Wifi } from "lucide-react";
import { AiSettingsPanel } from "@/components/AiSettingsPanel";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — TOC Sat Bantek" }, { name: "description", content: "Konfigurasi sistem TOC Sat Bantek Command Center." }] }),
  component: Page,
});

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-success" : "bg-muted"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </div>
  );
}

function Row({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-panel-elevated p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {control}
    </div>
  );
}

function Page() {
  return (
    <PageShell
      eyebrow="System"
      title="Pengaturan Sistem"
      description="Konfigurasi tampilan, koneksi data, AI engine, keamanan, dan notifikasi command center."
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2 text-xs text-foreground"><RotateCcw className="h-3.5 w-3.5" /> Reset Default</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"><Save className="h-3.5 w-3.5" /> Save Changes</button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <AiSettingsPanel />

        <Panel title="Tampilan & Bahasa" icon={<Palette className="h-4 w-4" />}>
          <div className="space-y-2.5">
            <Row label="Theme" hint="Command center dark mode dengan neon accent" control={<Pill tone="info">Dark · Neon</Pill>} />
            <Row label="Bahasa Antarmuka" hint="Indonesia (default)" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>Bahasa Indonesia</option><option>English</option></select>
            } />
            <Row label="Density" hint="Spasi antar elemen UI" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>Compact</option><option>Comfortable</option></select>
            } />
            <Row label="Animasi & Glow Effects" hint="Pulse, scanline, dan glow neon" control={<Toggle on={true} />} />
            <Row label="Reduce Motion" hint="Untuk pengguna sensitif animasi" control={<Toggle on={false} />} />
          </div>
        </Panel>

        <Panel title="Data & RSS Engine" icon={<Database className="h-4 w-4" />}>
          <div className="space-y-2.5">
            <Row label="Auto-sync RSS Feed" hint="Interval sinkronisasi otomatis" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>Setiap 5 menit</option><option>15 menit</option><option>1 jam</option></select>
            } />
            <Row label="Retention Periode" hint="Berapa lama data disimpan" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>90 hari</option><option>180 hari</option><option>1 tahun</option></select>
            } />
            <Row label="Cache Hasil Analisis" hint="Mempercepat halaman analitik" control={<Toggle on={true} />} />
            <Row label="Background Processing" hint="Jalankan ingestion di latar" control={<Toggle on={true} />} />
          </div>
        </Panel>

        <Panel title="AI Engine" icon={<Zap className="h-4 w-4" />}>
          <div className="space-y-2.5">
            <Row label="Sentiment Model" hint="Model NLP untuk klasifikasi sentimen" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>IndoBERT-Pro v3.2</option><option>XLM-R Multilingual</option></select>
            } />
            <Row label="Confidence Threshold" hint="Minimum confidence untuk publish hasil" control={<span className="font-mono text-xs text-foreground">≥ 75%</span>} />
            <Row label="Auto-classify Topik" hint="Klasifikasi otomatis kategori berita" control={<Toggle on={true} />} />
            <Row label="Predictive Forecasting" hint="Aktifkan ML forecast issue prediction" control={<Toggle on={true} />} />
            <div className="rounded-lg border border-info/30 bg-info/10 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-info">Model Health</p>
              <div className="mt-2 space-y-2">
                <Bar label="Sentiment accuracy" value={94} color="success" />
                <Bar label="Topic precision" value={87} color="primary" />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Keamanan & Akses" icon={<Shield className="h-4 w-4" />}>
          <div className="space-y-2.5">
            <Row label="Two-Factor Authentication" hint="Wajib untuk role Senior Analyst" control={<Toggle on={true} />} />
            <Row label="Session Timeout" hint="Otomatis logout setelah idle" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>30 menit</option><option>1 jam</option><option>4 jam</option></select>
            } />
            <Row label="IP Whitelist" hint="Hanya akses dari jaringan terdaftar" control={<Toggle on={false} />} />
            <Row label="Audit Log" hint="Catat semua aksi pengguna" control={<Toggle on={true} />} />
            <Row label="API Access Token" hint="Untuk integrasi eksternal" control={<Pill tone="warning">Rotate</Pill>} />
          </div>
        </Panel>

        <Panel title="Notifikasi & Alerts" icon={<Bell className="h-4 w-4" />}>
          <div className="space-y-2.5">
            <Row label="Sentiment Spike Alert" hint="Notifikasi saat negatif >20% naik" control={<Toggle on={true} />} />
            <Row label="Trending Keyword Baru" hint="Real-time deteksi topik viral" control={<Toggle on={true} />} />
            <Row label="Daily Digest (08:00 WIB)" hint="Ringkasan harian via email" control={<Toggle on={true} />} />
            <Row label="WhatsApp Notification" hint="Kirim alert via WA Business" control={<Toggle on={false} />} />
            <Row label="Sound Alert" hint="Bunyi notifikasi di browser" control={<Toggle on={false} />} />
          </div>
        </Panel>

        <Panel title="System Health" icon={<Cpu className="h-4 w-4" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border bg-panel-elevated p-3 text-center">
                <Cpu className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 font-mono text-lg font-bold text-foreground">42%</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">CPU</p>
              </div>
              <div className="rounded-lg border border-border bg-panel-elevated p-3 text-center">
                <HardDrive className="mx-auto h-4 w-4 text-violet" />
                <p className="mt-1 font-mono text-lg font-bold text-foreground">68%</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Storage</p>
              </div>
              <div className="rounded-lg border border-border bg-panel-elevated p-3 text-center">
                <Wifi className="mx-auto h-4 w-4 text-success" />
                <p className="mt-1 font-mono text-lg font-bold text-foreground">12ms</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Latency</p>
              </div>
            </div>
            <Bar label="Database Health" value={96} color="success" />
            <Bar label="API Throughput" value={78} color="primary" />
            <Bar label="Worker Queue" value={34} color="warning" />
            <div className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
              <div className="flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-primary" /><span className="text-sm text-foreground">Build Version</span></div>
              <span className="font-mono text-xs text-muted-foreground">v2.4.1 · 2024.12.23</span>
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Region & Localization" icon={<Globe className="h-4 w-4" />}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Row label="Timezone" hint="Waktu sistem & timestamp" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>WIB (UTC+7)</option><option>WITA (UTC+8)</option><option>WIT (UTC+9)</option></select>
            } />
            <Row label="Format Tanggal" hint="Tampilan tanggal di seluruh app" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>DD-MM-YYYY</option><option>YYYY-MM-DD</option></select>
            } />
            <Row label="Default Region Filter" hint="Region awal untuk peta sentimen" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>Seluruh Indonesia</option><option>DKI Jakarta</option><option>Jawa Barat</option></select>
            } />
            <Row label="Currency Format" hint="Untuk metrik bernilai uang" control={
              <select className="rounded-md border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground"><option>IDR (Rp)</option><option>USD ($)</option></select>
            } />
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
