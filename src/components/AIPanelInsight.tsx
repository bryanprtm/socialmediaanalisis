import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { generatePanelInsight } from "@/lib/ai-insights.functions";

type Props = {
  panel: string;
  data: Record<string, unknown> | string;
  className?: string;
};

export function AIPanelInsight({ panel, data, className }: Props) {
  const fn = useServerFn(generatePanelInsight);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const payload = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      const r = await fn({ data: { panel, data: payload.slice(0, 7500) } });
      setText(r.insight);
      setUpdatedAt(r.generatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghasilkan analisa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 ${className ?? ""}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> Analisa AI (OpenAI)
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded border border-border bg-panel-elevated px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground hover:border-primary/40 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {text ? "Refresh" : "Analisa"}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : loading && !text ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Menyusun analisa…
        </p>
      ) : text ? (
        <div className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">{text}</div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Klik <span className="font-semibold text-primary">Analisa</span> untuk insight AI berbasis data panel ini.
        </p>
      )}
      {updatedAt && (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {new Date(updatedAt).toLocaleString("id-ID")}
        </p>
      )}
    </div>
  );
}
