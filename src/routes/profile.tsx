import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { User, Mail, Phone, MapPin, Shield, Activity, Clock, Award, Edit3, Camera, Key, Bell, FileText, Eye } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — PROPAM" }, { name: "description", content: "Profil pengguna PROPAM Command Center." }] }),
  component: Page,
});

const activity = [
  { t: "10:24", action: "Generated comprehensive report", target: "Laporan_Dec_2024.pdf", icon: FileText },
  { t: "09:47", action: "Configured RSS feed", target: "Tempo.co · Politik", icon: Activity },
  { t: "09:12", action: "Reviewed sentiment analysis", target: "Topik: Reformasi Birokrasi", icon: Eye },
  { t: "08:55", action: "Implemented recommendation", target: "Konten Reformasi Birokrasi", icon: Award },
  { t: "08:30", action: "Login from Jakarta, ID", target: "Chrome · Windows 11", icon: Shield },
];

function Page() {
  return (
    <PageShell
      eyebrow="Account"
      title="Profil Pengguna"
      description="Kelola informasi akun, preferensi, dan akses sistem command center."
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2 text-xs text-foreground"><Key className="h-3.5 w-3.5" /> Change Password</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"><Edit3 className="h-3.5 w-3.5" /> Edit Profile</button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Panel>
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-violet/30 shadow-glow-cyan">
                <User className="h-14 w-14 text-foreground" />
              </div>
              <button className="absolute -bottom-1 -right-1 rounded-lg border border-border bg-panel-elevated p-1.5 text-muted-foreground hover:text-foreground" aria-label="Change avatar">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-4 font-display text-xl font-bold text-foreground">Komisaris Andika P.</p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-primary">Senior Analyst · L4</p>
            <div className="mt-2 flex gap-2">
              <Pill tone="positive">Active</Pill>
              <Pill tone="info">Verified</Pill>
            </div>
          </div>
          <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
            <div className="flex items-center gap-2.5 text-muted-foreground"><Mail className="h-4 w-4 text-primary" /> andika.p@propam.go.id</div>
            <div className="flex items-center gap-2.5 text-muted-foreground"><Phone className="h-4 w-4 text-primary" /> +62 812-3456-7890</div>
            <div className="flex items-center gap-2.5 text-muted-foreground"><MapPin className="h-4 w-4 text-primary" /> Jakarta Pusat, ID</div>
            <div className="flex items-center gap-2.5 text-muted-foreground"><Shield className="h-4 w-4 text-primary" /> 2FA Enabled</div>
          </div>
        </Panel>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Reports Generated" value="142" accent="cyan" icon={<FileText className="h-5 w-5" />} />
            <MetricCard label="Actions Implemented" value="38" accent="success" icon={<Award className="h-5 w-5" />} />
            <MetricCard label="Active Sessions" value="3" accent="violet" icon={<Activity className="h-5 w-5" />} />
            <MetricCard label="Avg Response" value="1.2h" accent="amber" icon={<Clock className="h-5 w-5" />} />
          </div>

          <Panel title="Informasi Akun" icon={<User className="h-4 w-4" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { l: "Full Name", v: "Komisaris Andika Pratama" },
                { l: "Employee ID", v: "PRP-2024-0142" },
                { l: "Department", v: "Analisis Sentimen Publik" },
                { l: "Role", v: "Senior Analyst" },
                { l: "Joined", v: "12 Jan 2022" },
                { l: "Last Login", v: "Today, 08:30" },
              ].map((f) => (
                <div key={f.l}>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{f.l}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{f.v}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Aktivitas Terbaru" icon={<Activity className="h-4 w-4" />} action={<Pill tone="info">Last 24h</Pill>}>
            <ul className="space-y-2">
              {activity.map((a, i) => {
                const I = a.icon;
                return (
                  <li key={i} className="flex items-center gap-3 rounded-lg border border-border bg-panel-elevated p-3">
                    <span className="font-mono text-[11px] text-muted-foreground">{a.t}</span>
                    <I className="h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{a.action}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{a.target}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Preferensi Notifikasi" icon={<Bell className="h-4 w-4" />}>
            <ul className="space-y-2.5">
              {[
                { l: "Alert sentimen negatif spike", on: true },
                { l: "Daily digest report (08:00 WIB)", on: true },
                { l: "Trending keyword baru terdeteksi", on: true },
                { l: "RSS feed error notification", on: false },
                { l: "Weekly performance summary", on: true },
              ].map((p) => (
                <li key={p.l} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated p-3">
                  <span className="text-sm text-foreground">{p.l}</span>
                  <div className={`relative h-5 w-9 rounded-full transition-colors ${p.on ? "bg-success" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${p.on ? "left-[18px]" : "left-0.5"}`} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
