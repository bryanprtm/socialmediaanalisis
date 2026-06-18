import { Calendar, X, RotateCcw } from "lucide-react";
import { useDateFilter } from "@/hooks/use-date-filter";

const PRESETS = [
  { label: "7 hari", days: 7 },
  { label: "30 hari", days: 30 },
  { label: "90 hari", days: 90 },
];

export function DateFilterBar() {
  const { startDate, endDate, setStartDate, setEndDate, setRange, clear, isActive } = useDateFilter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="h-3.5 w-3.5 text-primary" />
      <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Rentang Tanggal</span>

      <input
        type="date"
        value={startDate ?? ""}
        onChange={(e) => setStartDate(e.target.value || null)}
        className="h-8 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary/60 focus:outline-none"
      />
      <span className="text-xs text-muted-foreground">-</span>
      <input
        type="date"
        value={endDate ?? ""}
        onChange={(e) => setEndDate(e.target.value || null)}
        className="h-8 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary/60 focus:outline-none"
      />

      {PRESETS.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => setRange(p.days)}
          className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          {p.label}
        </button>
      ))}

      <button
        type="button"
        onClick={clear}
        disabled={!isActive}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
      >
        <RotateCcw className="h-3 w-3" /> Reset
      </button>
    </div>
  );
}
