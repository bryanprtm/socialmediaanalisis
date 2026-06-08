import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { Panel } from "@/components/PageShell";
import { generateAnalysisNarrative } from "@/lib/ai-narrative.functions";

type Props = {
  page: string;
  context: Record<string, unknown> | string;
  /** Auto-generate on mount/context-change after this many ms of idle. 0 disables auto. */
  autoMs?: number;
  className?: string;
};

export function AINarrative({ page, context, autoMs = 800, className }: Props) {
  const fn = useServerFn(generateAnalysisNarrative);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const lastKeyRef = useRef<string>("");

  const ctxString = typeof context === "string" ? context : JSON.stringify(context, null, 2);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await fn({ data: { page, context: ctxString.slice(0, 7500), language: "id" } });
      setText(r.narrative);
      setUpdatedAt(r.generatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghasilkan narasi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoMs) return;
    if (!ctxString || ctxString === "{}" || ctxString.length < 10) return;
    const key = page + "|" + ctxString;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    const t = setTimeout(() => {
      run();
    }, autoMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ctxString, autoMs]);

  return (
    <Panel
      className={className}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Analisa menggunakan AI
        </div>
      }
      action={
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground hover:border-primary/40 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
        </button>
      }
    >
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading && !text ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Menyusun analisa…
        </p>
      ) : text ? (
        <div className="space-y-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{text}</div>
      ) : (
        <p className="text-sm text-muted-foreground">Klik Refresh untuk menghasilkan narasi analisis berbasis data saat ini.</p>
      )}
      {updatedAt && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Diperbarui: {new Date(updatedAt).toLocaleString("id-ID")}
        </p>
      )}
    </Panel>
  );
}
