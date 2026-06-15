import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Mail, ArrowLeft } from "lucide-react";
import logo from "@/assets/propam-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login — TOC Sat Bantek Command Center" },
      { name: "description", content: "Masuk untuk mengelola berita dan pipeline monitoring." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/news" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else {
      toast.success("Login berhasil");
      navigate({ to: "/news" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Beranda
          </Link>

          <div className="rounded-2xl border border-border bg-panel p-8 shadow-elevated">
            <div className="mb-6 flex flex-col items-center text-center">
              <img src={logo} alt="TOC Sat Bantek" className="mb-3 h-14 w-14 drop-shadow-[0_0_18px_oklch(0.82_0.18_80_/_0.5)]" />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Command Center Access</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-foreground">Masuk ke Sistem</h1>
              <p className="mt-1 text-sm text-muted-foreground">Akses penuh untuk mengelola pipeline monitoring.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="h-11 w-full rounded-lg border border-border bg-panel-elevated pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-11 w-full rounded-lg border border-border bg-panel-elevated pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-cyan text-sm font-semibold text-background shadow-glow disabled:opacity-50"
              >
                {loading ? "Memproses…" : "Masuk"}
              </button>
            </form>

            <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Encrypted · TLS 1.3 · RLS Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
