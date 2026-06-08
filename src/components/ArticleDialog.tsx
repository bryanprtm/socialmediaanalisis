import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { Pill } from "@/components/PageShell";
import type { Article } from "@/hooks/use-filtered-articles";

type OpenArgs = {
  title: string;
  subtitle?: string;
  articles: Article[];
};

type Ctx = {
  open: (args: OpenArgs) => void;
};

const ArticleDialogCtx = createContext<Ctx | null>(null);

export function ArticleDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OpenArgs | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((args: OpenArgs) => {
    setState(args);
    setIsOpen(true);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  const sorted = useMemo(() => {
    if (!state) return [] as Article[];
    return [...state.articles].sort((a, b) => {
      const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
      const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
      return tb - ta;
    });
  }, [state]);

  return (
    <ArticleDialogCtx.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden bg-panel">
          <DialogHeader>
            <DialogTitle className="text-base">{state?.title ?? ""}</DialogTitle>
            {state?.subtitle && (
              <p className="font-mono text-[11px] text-muted-foreground">{state.subtitle}</p>
            )}
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {sorted.length} artikel
            </p>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            {sorted.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Tidak ada artikel pada irisan ini.
              </p>
            ) : (
              <ul className="space-y-2">
                {sorted.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-border bg-panel-elevated p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                          title={a.title}
                        >
                          {a.title}
                        </a>
                        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                          <span>{a.source}</span>
                          {a.category && <span>· {a.category}</span>}
                          {a.region && <span>· {a.region}</span>}
                          {a.published_at && (
                            <span>· {new Date(a.published_at).toLocaleString("id-ID")}</span>
                          )}
                        </div>
                        {a.excerpt && (
                          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                            {a.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {a.sentiment && (
                          <Pill
                            tone={
                              a.sentiment === "positive"
                                ? "positive"
                                : a.sentiment === "negative"
                                  ? "negative"
                                  : "neutral"
                            }
                          >
                            {a.sentiment}
                          </Pill>
                        )}
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-panel px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground hover:border-primary/40"
                        >
                          <ExternalLink className="h-3 w-3" /> Buka
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ArticleDialogCtx.Provider>
  );
}

export function useArticleDialog() {
  const ctx = useContext(ArticleDialogCtx);
  if (!ctx) throw new Error("useArticleDialog must be used within ArticleDialogProvider");
  return ctx;
}
