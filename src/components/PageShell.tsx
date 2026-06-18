import { type ReactNode } from "react";
import { TopNav } from "./TopNav";
import { useActiveKeyword } from "@/hooks/use-active-keyword";
import { useDateFilter } from "@/hooks/use-date-filter";
import { DateFilterBar } from "@/components/DateFilterBar";
import { Sparkles, X } from "lucide-react";

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { active, setActiveId } = useActiveKeyword();
  const { isActive: dateActive } = useDateFilter();
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      {(active || dateActive) && (
        <div className="border-b border-primary/20 bg-primary/5">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-6 py-2.5">
            {active ? (
              <div className="flex flex-wrap items-center gap-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Filter Aktif</span>
                <span className="text-sm font-semibold text-foreground">{active.name}</span>
                <code className="rounded-md border border-primary/20 bg-background/60 px-2 py-0.5 font-mono text-[11px] text-primary">
                  {active.expression}
                </code>
                <button
                  onClick={() => setActiveId(null)}
                  className="ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" /> Hapus filter
                </button>
              </div>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Filter</span>
            )}
            <DateFilterBar />
          </div>
        </div>
      )}
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && (
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                ▸ {eyebrow}
              </p>
            )}
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}

export function Panel({
  title,
  icon,
  action,
  className = "",
  children,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`panel relative overflow-hidden ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            {icon && <span className="text-primary">{icon}</span>}
            {title}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon,
  accent = "cyan",
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  icon?: ReactNode;
  accent?: "cyan" | "violet" | "magenta" | "amber" | "success" | "danger";
  hint?: string;
}) {
  const accentMap = {
    cyan: { text: "text-cyan", grad: "bg-gradient-cyan", glow: "shadow-[0_0_24px_-6px_oklch(0.78_0.18_195_/_0.6)]" },
    violet: { text: "text-violet", grad: "bg-gradient-violet", glow: "shadow-[0_0_24px_-6px_oklch(0.65_0.22_295_/_0.6)]" },
    magenta: { text: "text-magenta", grad: "bg-gradient-magenta", glow: "shadow-[0_0_24px_-6px_oklch(0.7_0.25_330_/_0.6)]" },
    amber: { text: "text-amber", grad: "bg-gradient-amber", glow: "shadow-[0_0_24px_-6px_oklch(0.82_0.18_80_/_0.6)]" },
    success: { text: "text-success", grad: "bg-gradient-success", glow: "shadow-[0_0_24px_-6px_oklch(0.78_0.2_150_/_0.6)]" },
    danger: { text: "text-destructive", grad: "bg-gradient-danger", glow: "shadow-[0_0_24px_-6px_oklch(0.65_0.24_22_/_0.6)]" },
  } as const;
  const a = accentMap[accent];
  const deltaClr =
    deltaTone === "up" ? "text-success" : deltaTone === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="panel group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${a.grad} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className={`mt-2 font-display text-3xl font-bold ${a.text}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={`rounded-lg ${a.grad} p-2 text-background ${a.glow}`}>{icon}</div>
        )}
      </div>
      {delta && (
        <p className={`mt-3 inline-flex items-center gap-1 font-mono text-xs ${deltaClr}`}>
          <span>{deltaTone === "up" ? "▲" : deltaTone === "down" ? "▼" : "■"}</span>
          {delta}
        </p>
      )}
      <div className={`absolute inset-x-0 bottom-0 h-px ${a.grad} opacity-60`} />
    </div>
  );
}

export function Bar({
  label,
  value,
  max = 100,
  color = "primary",
  unit = "%",
}: {
  label: string;
  value: number;
  max?: number;
  color?: "primary" | "success" | "danger" | "warning" | "violet" | "neutral";
  unit?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colorMap = {
    primary: "bg-gradient-cyan",
    success: "bg-gradient-success",
    danger: "bg-gradient-danger",
    warning: "bg-gradient-amber",
    violet: "bg-gradient-violet",
    neutral: "bg-muted-foreground/60",
  } as const;
  const txt = {
    primary: "text-primary",
    success: "text-success",
    danger: "text-destructive",
    warning: "text-amber",
    violet: "text-violet",
    neutral: "text-muted-foreground",
  } as const;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className={`font-mono font-semibold ${txt[color]}`}>
          {value}
          {unit}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${colorMap[color]} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "positive" | "negative" | "neutral" | "warning" | "info" | "violet";
}) {
  const map = {
    positive: "bg-success/15 text-success border-success/25",
    negative: "bg-destructive/15 text-destructive border-destructive/25",
    neutral: "bg-muted text-muted-foreground border-border",
    warning: "bg-amber/15 text-amber border-amber/25",
    info: "bg-info/15 text-info border-info/25",
    violet: "bg-violet/15 text-violet border-violet/25",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${map[tone]}`}>
      {children}
    </span>
  );
}
