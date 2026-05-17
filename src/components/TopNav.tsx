import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  LayoutDashboard,
  Brain,
  Zap,
  Wrench,
  ChevronDown,
  User,
  Settings,
  LogOut,
  LogIn,
  Search,
  Activity,
  TrendingUp,
  Globe,
  Network,
  GitCompare,
  Target,
  Radio,
  Map,
  FileBarChart,
  Rss,
  Database,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useActiveKeyword } from "@/hooks/use-active-keyword";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/propam-logo.png";

type NavLeaf = { to: string; label: string; desc: string; icon: typeof Home };
type NavGroup = {
  to: string;
  label: string;
  icon: typeof Home;
  hasDropdown?: boolean;
  items?: NavLeaf[];
};

const navItems: NavGroup[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    to: "/sentiment",
    label: "Analysis",
    icon: Brain,
    hasDropdown: true,
    items: [
      { to: "/sentiment", label: "Sentiment Analysis", desc: "Deep AI sentiment dengan ML", icon: Brain },
      { to: "/search", label: "Search & Monitoring", desc: "Pencarian + filter advanced", icon: Search },
      { to: "/trends", label: "Trends & Topics", desc: "Trending topics & evolusi", icon: TrendingUp },
      { to: "/media", label: "Media Analysis", desc: "Kredibilitas sumber media", icon: Globe },
    ],
  },
  {
    to: "/prediction",
    label: "Advanced",
    icon: Zap,
    hasDropdown: true,
    items: [
      { to: "/prediction", label: "Issue Prediction", desc: "Prediksi tren topik dengan ML", icon: Activity },
      { to: "/sna", label: "SNA Visualization", desc: "Social Network Analysis", icon: Network },
      { to: "/comparative", label: "Comparative Analysis", desc: "Perbandingan antar sumber", icon: GitCompare },
      { to: "/recommendations", label: "Action Recommendations", desc: "Strategi berbasis AI", icon: Target },
    ],
  },
  {
    to: "/rss",
    label: "Tools",
    icon: Wrench,
    hasDropdown: true,
    items: [
      { to: "/news", label: "News Database", desc: "Storage seluruh berita real-time", icon: Database },
      { to: "/keywords", label: "Kata Kunci Pencarian", desc: "Boolean query: IF · AND · OR · NOT", icon: KeyRound },
      { to: "/rss", label: "RSS Manager", desc: "Kelola RSS feed", icon: Rss },
      { to: "/map", label: "Peta Indonesia", desc: "Distribusi sentiment geografis", icon: Map },
      { to: "/export", label: "Export Report", desc: "Generate laporan WhatsApp", icon: FileBarChart },
    ],
  },
];

export function TopNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { queries, active, setActiveId } = useActiveKeyword();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [kwOpen, setKwOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const kwRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (kwRef.current && !kwRef.current.contains(e.target as Node)) setKwOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Logout berhasil");
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="PROPAM Home">
          <img src={logo} alt="PROPAM" width={44} height={44} className="h-11 w-11 drop-shadow-[0_0_12px_oklch(0.82_0.18_80_/_0.5)]" />
        </Link>

        <nav ref={navRef} className="hidden items-center gap-1 md:flex">
          {(isAuthenticated ? navItems : navItems.filter((i) => i.to === "/")).map((item) => {
            const Icon = item.icon;
            const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const allMatch =
              item.items?.some((i) => pathname.startsWith(i.to)) ?? false;
            const active = isActive || allMatch;

            if (!item.hasDropdown) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.78_0.18_195_/_0.3)]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={item.label} className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    active || openMenu === item.label
                      ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.78_0.18_195_/_0.3)]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openMenu === item.label ? "rotate-180" : ""}`} />
                </button>
                {openMenu === item.label && item.items && (
                  <div className="absolute left-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-elevated">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <div className="p-1.5">
                      {item.items.map((leaf) => {
                        const LeafIcon = leaf.icon;
                        return (
                          <Link
                            key={leaf.to}
                            to={leaf.to}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                          >
                            <div className="rounded-md bg-primary/15 p-2 text-primary">
                              <LeafIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{leaf.label}</p>
                              <p className="truncate text-xs text-muted-foreground">{leaf.desc}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          {isAuthenticated && (
            <div ref={kwRef} className="relative hidden md:block">
              <button
                onClick={() => setKwOpen((v) => !v)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-panel text-muted-foreground hover:text-foreground"
                }`}
                title="Pilih kata kunci pencarian aktif"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span className="max-w-[140px] truncate">{active ? active.name : "Pilih Kata Kunci"}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${kwOpen ? "rotate-180" : ""}`} />
              </button>
              {kwOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-elevated">
                  <div className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Kata Kunci Pencarian Aktif
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    <button
                      onClick={() => { setActiveId(null); setKwOpen(false); }}
                      className={`flex w-full items-center gap-2 rounded-lg p-2.5 text-left transition ${!active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      <span className="text-sm">— Tidak ada filter —</span>
                    </button>
                    {queries.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                        Belum ada kata kunci.
                        <Link to="/keywords" onClick={() => setKwOpen(false)} className="mt-1 block text-primary hover:underline">Tambah sekarang →</Link>
                      </div>
                    ) : (
                      queries.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => { setActiveId(q.id); setKwOpen(false); }}
                          className={`flex w-full items-start gap-2 rounded-lg p-2.5 text-left transition ${active?.id === q.id ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted"}`}
                        >
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{q.name}</p>
                            <code className="block truncate font-mono text-[10px] text-muted-foreground">{q.expression}</code>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <Link to="/keywords" onClick={() => setKwOpen(false)} className="block border-t border-border px-3 py-2 text-center text-xs font-semibold text-primary hover:bg-muted">
                    Kelola Kata Kunci →
                  </Link>
                </div>
              )}
            </div>
          )}
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5 lg:flex">
            <Radio className="h-3.5 w-3.5 text-success animate-pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
            <span className="font-mono text-xs font-semibold text-foreground">02:47:13</span>
          </div>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hidden items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5 sm:inline-flex" aria-label="Profile">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">{user?.email?.split("@")[0]}</span>
              </Link>
              <Link to="/settings" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Settings">
                <Settings className="h-4.5 w-4.5" />
              </Link>
              <button onClick={handleLogout} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive" aria-label="Logout">
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-3.5 py-2 text-xs font-semibold text-background shadow-glow"
            >
              <LogIn className="h-3.5 w-3.5" /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
