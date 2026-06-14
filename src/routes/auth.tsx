import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loginUser, registerUser } from "@/lib/auth/auth.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Lock, Mail, User as UserIcon, ArrowLeft } from "lucide-react";
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
  const { isAuthenticated, loading, refresh } = useAuth();
  const callLogin = useServerFn(loginUser);
  const callRegister = useServerFn(registerUser);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate({ to: "/news" });
  }, [isAuthenticated, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await callLogin({ data: { email, password } });
        toast.success("Login berhasil");
      } else {
        await callRegister({ data: { email, password, displayName: displayName || undefined } });
        toast.success("Akun dibuat. Selamat datang!");
      }
      await refresh();
      navigate({ to: "/news" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memproses";
      toast.error(msg.replace(/^Error:\s*/, ""));
    } finally {
      setSubmitting(false);
    }
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
              <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
                {mode === "login" ? "Masuk ke Sistem" : "Daftar Akun Baru"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Akses penuh untuk mengelola pipeline monitoring."
                  : "Pengguna pertama otomatis menjadi admin."}
              </p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-border bg-panel-elevated p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    mode === m ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nama (opsional)"
                    maxLength={120}
                    className="h-11 w-full rounded-lg border border-border bg-panel-elevated pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                  />
                </div>
              )}
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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min. 8 karakter)"
                  className="h-11 w-full rounded-lg border border-border bg-panel-elevated pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-cyan text-sm font-semibold text-background shadow-glow disabled:opacity-50"
              >
                {submitting ? "Memproses…" : mode === "login" ? "Masuk" : "Daftar"}
              </button>
            </form>

            <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              JWT · bcrypt · HTTP-only Cookie
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
