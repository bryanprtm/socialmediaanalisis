import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type KeywordQuery = {
  id: string;
  name: string;
  expression: string;
  terms: string[];
  description: string | null;
};

type Ctx = {
  queries: KeywordQuery[];
  active: KeywordQuery | null;
  setActiveId: (id: string | null) => void;
  reload: () => Promise<void>;
};

const ActiveKeywordCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "active_keyword_query_id";

export function ActiveKeywordProvider({ children }: { children: ReactNode }) {
  const [queries, setQueries] = useState<KeywordQuery[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("keyword_queries")
      .select("id,name,expression,terms,description")
      .order("name");
    setQueries((data ?? []) as KeywordQuery[]);
  }, []);

  useEffect(() => {
    reload();
    const ch = supabase
      .channel("keyword-queries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "keyword_queries" },
        () => reload(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [reload]);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const active = queries.find((q) => q.id === activeId) ?? null;

  return (
    <ActiveKeywordCtx.Provider value={{ queries, active, setActiveId, reload }}>
      {children}
    </ActiveKeywordCtx.Provider>
  );
}

export function useActiveKeyword() {
  const ctx = useContext(ActiveKeywordCtx);
  if (!ctx) throw new Error("useActiveKeyword must be used within ActiveKeywordProvider");
  return ctx;
}
