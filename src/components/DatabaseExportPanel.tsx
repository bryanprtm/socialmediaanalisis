import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Panel } from "@/components/PageShell";
import { Download, Database, Loader2, FileJson, FileSpreadsheet } from "lucide-react";
import { exportDatabase } from "@/lib/db-export.functions";

import { toast } from "sonner";

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const cols = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r ?? {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  ) as string[];
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => escape(r[c])).join(","))].join("\n");
}

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function DatabaseExportPanel() {
  const run = useServerFn(exportDatabase);
  const [loading, setLoading] = useState<"json" | "csv" | null>(null);
  const [lastCounts, setLastCounts] = useState<Record<string, number> | null>(null);

  const handleExport = async (fmt: "json" | "csv") => {
    setLoading(fmt);
    try {
      const res: any = await run();
      setLastCounts(res.counts);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      if (fmt === "json") {
        download(`database-backup-${stamp}.json`, JSON.stringify(res, null, 2), "application/json");
      } else {
        // Concatenated CSV per table separated by header lines
        const parts: string[] = [];
        for (const [table, rows] of Object.entries(res.tables) as [string, any[]][]) {
          parts.push(`# TABLE: ${table} (${rows.length} rows)`);
          parts.push(toCsv(rows));
          parts.push("");
        }
        download(`database-backup-${stamp}.csv`, parts.join("\n"), "text/csv");
      }
      toast.success(`Backup ${fmt.toUpperCase()} berhasil diunduh`);
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal export database");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Panel className="lg:col-span-2" title="Backup Database" icon={<Database className="h-4 w-4" />}>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Unduh seluruh isi database aplikasi (semua tabel) sebagai satu file backup. Kunci sensitif seperti API key
          akan disamarkan. Hanya admin yang dapat menggunakan fitur ini.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport("json")}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50"
          >
            {loading === "json" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileJson className="h-3.5 w-3.5" />}
            Download .json
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2 text-xs text-foreground disabled:opacity-50"
          >
            {loading === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
            Download .csv
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Download className="h-3 w-3" /> Full snapshot
          </span>
        </div>
        {lastCounts && (
          <div className="rounded-lg border border-border bg-panel-elevated p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Last export</p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
              {Object.entries(lastCounts).map(([t, c]) => (
                <div key={t} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{t}</span>
                  <span className="font-mono text-muted-foreground">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
