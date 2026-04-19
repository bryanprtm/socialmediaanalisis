import { Link, useLocation } from "@tanstack/react-router";
import { Home, LayoutDashboard, Brain, Zap, Wrench, ChevronDown, User, Settings, LogOut } from "lucide-react";
import logo from "@/assets/propam-logo.png";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analysis", label: "Analysis", icon: Brain, hasDropdown: true },
  { to: "/advanced", label: "Advanced", icon: Zap, hasDropdown: true },
  { to: "/tools", label: "Tools", icon: Wrench, hasDropdown: true },
] as const;

export function TopNav() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="PROPAM" width={36} height={36} className="h-9 w-9" />
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
            PROPAM
          </span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.hasDropdown && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Profile">
            <User className="h-5 w-5" />
          </button>
          <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </button>
          <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
