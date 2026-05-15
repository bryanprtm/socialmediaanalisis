import { Link, useLocation } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
      { to: "/rss", label: "Keyword & RSS Manager", desc: "Kelola RSS feed & keyword", icon: Rss },
      { to: "/map", label: "Peta Indonesia", desc: "Distribusi sentiment geografis", icon: Map },
      { to: "/export", label: "Export Report", desc: "Generate laporan WhatsApp", icon: FileBarChart },
    ],
  },
];

export function TopNav() {
  const { pathname } = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="PROPAM Home">
          <img src={logo} alt="PROPAM" width={44} height={44} className="h-11 w-11 drop-shadow-[0_0_12px_oklch(0.82_0.18_80_/_0.5)]" />
        </Link>

        <nav ref={navRef} className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
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
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5 lg:flex">
            <Radio className="h-3.5 w-3.5 text-success animate-pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
            <span className="font-mono text-xs font-semibold text-foreground">02:47:13</span>
          </div>
          <Link to="/profile" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Profile">
            <User className="h-4.5 w-4.5" />
          </Link>
          <Link to="/settings" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Settings">
            <Settings className="h-4.5 w-4.5" />
          </Link>
          <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Logout">
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
