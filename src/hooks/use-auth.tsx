import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, logoutUser as logoutFn } from "@/lib/auth/auth.functions";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchMe = useServerFn(getCurrentUser);
  const callLogout = useServerFn(logoutFn);

  const refresh = useCallback(async () => {
    try {
      const me = (await fetchMe()) as AuthUser | null;
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchMe]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await callLogout();
    } finally {
      setUser(null);
    }
  }, [callLogout]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback when used outside provider (should not happen)
    return {
      user: null,
      loading: false,
      isAuthenticated: false,
      refresh: async () => {},
      logout: async () => {},
    };
  }
  return ctx;
}
