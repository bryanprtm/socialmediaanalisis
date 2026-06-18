import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

const KEY_START = "date_filter_start";
const KEY_END = "date_filter_end";

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Ctx = {
  startDate: string | null;
  endDate: string | null;
  setStartDate: (d: string | null) => void;
  setEndDate: (d: string | null) => void;
  setRange: (days: number) => void;
  clear: () => void;
  isActive: boolean;
};

const DateFilterCtx = createContext<Ctx | null>(null);

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const [startDate, setStartDateState] = useState<string | null>(null);
  const [endDate, setEndDateState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setStartDateState(localStorage.getItem(KEY_START));
    setEndDateState(localStorage.getItem(KEY_END));
    setReady(true);
  }, []);

  const persist = useCallback((key: string, value: string | null) => {
    if (typeof window === "undefined") return;
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }, []);

  const setStartDate = useCallback(
    (d: string | null) => {
      setStartDateState(d);
      persist(KEY_START, d);
    },
    [persist],
  );

  const setEndDate = useCallback(
    (d: string | null) => {
      setEndDateState(d);
      persist(KEY_END, d);
    },
    [persist],
  );

  const setRange = useCallback(
    (days: number) => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - (days - 1));
      const s = formatDate(start);
      const e = formatDate(end);
      setStartDateState(s);
      setEndDateState(e);
      persist(KEY_START, s);
      persist(KEY_END, e);
    },
    [persist],
  );

  const clear = useCallback(() => {
    setStartDateState(null);
    setEndDateState(null);
    persist(KEY_START, null);
    persist(KEY_END, null);
  }, [persist]);

  const isActive = !!(startDate && endDate);

  return (
    <DateFilterCtx.Provider
      value={{
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        setRange,
        clear,
        isActive,
      }}
    >
      {children}
    </DateFilterCtx.Provider>
  );
}

export function useDateFilter() {
  const ctx = useContext(DateFilterCtx);
  if (!ctx) throw new Error("useDateFilter must be used within DateFilterProvider");
  return ctx;
}

export function matchesDateFilter(
  published_at: string | null,
  startDate: string | null,
  endDate: string | null,
): boolean {
  if (!startDate && !endDate) return true;
  if (!published_at) return false;
  const t = new Date(published_at).getTime();
  if (Number.isNaN(t)) return false;
  if (startDate) {
    const start = new Date(`${startDate}T00:00:00`).getTime();
    if (t < start) return false;
  }
  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999`).getTime();
    if (t > end) return false;
  }
  return true;
}
