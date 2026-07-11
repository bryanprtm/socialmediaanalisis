import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, Panel, Pill } from "@/components/PageShell";
import { User, Mail, Shield, Key, UserPlus, Trash2, Save, Lock, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyProfile,
  updateMyProfile,
  listUsers,
  createUser,
  deleteUser,
  setUserRole,
  adminResetPassword,
} from "@/lib/user-admin.functions";
import { getAiSettings, updateAiSettings, type AiSettingsPublic } from "@/lib/ai-settings.functions";


export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil — TOC Sat Bantek" },
      { name: "description", content: "Kelola akun, password, dan pengguna sistem." },
    ],
  }),
  component: Page,
});

type Me = Awaited<ReturnType<typeof getMyProfile>>;
type UserRow = Awaited<ReturnType<typeof listUsers>>[number];

function Page() {
  const fetchMe = useServerFn(getMyProfile);
  const saveMe = useServerFn(updateMyProfile);
  const fetchUsers = useServerFn(listUsers);
  const addUser = useServerFn(createUser);
  const removeUser = useServerFn(deleteUser);
  const changeRole = useServerFn(setUserRole);
  const resetPwd = useServerFn(adminResetPassword);
  const fetchAi = useServerFn(getAiSettings);
  const saveAi = useServerFn(updateAiSettings);


  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [nu, setNu] = useState({ email: "", password: "", display_name: "", role: "user" as "user" | "admin" });
  const [adding, setAdding] = useState(false);

  const [ai, setAi] = useState<AiSettingsPublic | null>(null);
  const [aiForm, setAiForm] = useState({ provider: "openai" as "openai" | "lovable", key: "", model: "gpt-4o-mini", imageModel: "gpt-image-1" });
  const [aiSaving, setAiSaving] = useState(false);

  const isAdmin = !!me?.roles.includes("admin");



  async function loadMe() {
    try {
      setLoading(true);
      const m = await fetchMe();
      setMe(m);
      setDisplayName(m.display_name ?? "");
      setEmail(m.email ?? "");
    } catch (e: any) {
      toast.error(e.message ?? "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      setUsersLoading(true);
      setUsers(await fetchUsers());
    } catch (e: any) {
      toast.error(e.message ?? "Gagal memuat pengguna");
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => { loadMe(); }, []);
  useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMe({ data: { email, display_name: displayName } });
      toast.success("Profil tersimpan. Jika email berubah, cek inbox untuk konfirmasi.");
      await loadMe();
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd.length < 6) return toast.error("Password minimal 6 karakter");
    if (newPwd !== newPwd2) return toast.error("Konfirmasi password tidak cocok");
    setPwdSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast.success("Password berhasil diubah");
      setNewPwd(""); setNewPwd2("");
    } catch (e: any) {
      toast.error(e.message ?? "Gagal mengubah password");
    } finally {
      setPwdSaving(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await addUser({ data: nu });
      toast.success("Pengguna ditambahkan");
      setNu({ email: "", password: "", display_name: "", role: "user" });
      await loadUsers();
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menambahkan pengguna");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(u: UserRow) {
    if (!confirm(`Hapus pengguna ${u.email}?`)) return;
    try {
      await removeUser({ data: { userId: u.id } });
      toast.success("Pengguna dihapus");
      await loadUsers();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleRoleChange(u: UserRow, role: "user" | "admin") {
    try {
      await changeRole({ data: { userId: u.id, role } });
      toast.success("Role diperbarui");
      await loadUsers();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleResetPwd(u: UserRow) {
    const pwd = prompt(`Password baru untuk ${u.email} (min 6 karakter):`);
    if (!pwd) return;
    try {
      await resetPwd({ data: { userId: u.id, password: pwd } });
      toast.success("Password direset");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <PageShell
      eyebrow="Account"
      title="Profil & Manajemen Pengguna"
      description="Kelola informasi akun, ubah password, dan (untuk admin) kelola pengguna sistem."
    >
      {loading ? (
        <Panel><p className="text-sm text-muted-foreground">Memuat…</p></Panel>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <Panel>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-violet/30 shadow-glow-cyan">
                <User className="h-12 w-12 text-foreground" />
              </div>
              <p className="mt-4 font-display text-lg font-bold text-foreground">{me?.display_name || me?.email}</p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-primary">
                {me?.roles.join(", ") || "user"}
              </p>
              <div className="mt-2 flex gap-2">
                <Pill tone="positive">Active</Pill>
                {isAdmin && <Pill tone="info">Admin</Pill>}
              </div>
            </div>
            <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex items-center gap-2.5 text-muted-foreground"><Mail className="h-4 w-4 text-primary" /> {me?.email}</div>
              <div className="flex items-center gap-2.5 text-muted-foreground"><Shield className="h-4 w-4 text-primary" /> ID: <span className="font-mono text-[11px]">{me?.id.slice(0, 8)}…</span></div>
            </div>
          </Panel>

          <div className="space-y-5">
            <Panel title="Data Akun" icon={<User className="h-4 w-4" />}>
              <form onSubmit={handleSaveProfile} className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama Tampilan">
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} placeholder="Nama lengkap" />
                </Field>
                <Field label="Email">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
                </Field>
                <div className="sm:col-span-2 flex justify-end">
                  <button disabled={saving} className={btnPrimary}>
                    <Save className="h-3.5 w-3.5" /> {saving ? "Menyimpan…" : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </Panel>

            <Panel title="Ubah Password" icon={<Key className="h-4 w-4" />}>
              <form onSubmit={handleChangePassword} className="grid gap-4 sm:grid-cols-2">
                <Field label="Password Baru">
                  <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={inputCls} minLength={6} required />
                </Field>
                <Field label="Konfirmasi Password">
                  <input type="password" value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} className={inputCls} minLength={6} required />
                </Field>
                <div className="sm:col-span-2 flex justify-end">
                  <button disabled={pwdSaving} className={btnPrimary}>
                    <Lock className="h-3.5 w-3.5" /> {pwdSaving ? "Memproses…" : "Ubah Password"}
                  </button>
                </div>
              </form>
            </Panel>

            {isAdmin && (
              <>
                <Panel title="Tambah Pengguna" icon={<UserPlus className="h-4 w-4" />}>
                  <form onSubmit={handleAddUser} className="grid gap-4 sm:grid-cols-2">
                    <Field label="Email">
                      <input type="email" required value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Nama Tampilan">
                      <input value={nu.display_name} onChange={(e) => setNu({ ...nu, display_name: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Password (min 6)">
                      <input type="text" required minLength={6} value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Role">
                      <select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value as "user" | "admin" })} className={inputCls}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </Field>
                    <div className="sm:col-span-2 flex justify-end">
                      <button disabled={adding} className={btnPrimary}>
                        <UserPlus className="h-3.5 w-3.5" /> {adding ? "Menambahkan…" : "Tambah Pengguna"}
                      </button>
                    </div>
                  </form>
                </Panel>

                <Panel
                  title="Daftar Pengguna"
                  icon={<Shield className="h-4 w-4" />}
                  action={
                    <button onClick={loadUsers} className="inline-flex items-center gap-1 rounded-md border border-border bg-panel-elevated px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
                      <RefreshCw className="h-3 w-3" /> Refresh
                    </button>
                  }
                >
                  {usersLoading ? (
                    <p className="text-sm text-muted-foreground">Memuat…</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            <th className="py-2 pr-3">Email</th>
                            <th className="py-2 pr-3">Nama</th>
                            <th className="py-2 pr-3">Role</th>
                            <th className="py-2 pr-3">Login Terakhir</th>
                            <th className="py-2 pr-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id} className="border-b border-border/60">
                              <td className="py-2 pr-3 font-mono text-[12px] text-foreground">{u.email}</td>
                              <td className="py-2 pr-3 text-muted-foreground">{u.display_name || "—"}</td>
                              <td className="py-2 pr-3">
                                <select
                                  value={u.roles.includes("admin") ? "admin" : "user"}
                                  onChange={(e) => handleRoleChange(u, e.target.value as "user" | "admin")}
                                  className="rounded-md border border-border bg-panel-elevated px-2 py-1 text-xs"
                                  disabled={u.id === me?.id}
                                >
                                  <option value="user">user</option>
                                  <option value="admin">admin</option>
                                </select>
                              </td>
                              <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">
                                {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("id-ID") : "—"}
                              </td>
                              <td className="py-2 pr-3 text-right">
                                <div className="inline-flex gap-1.5">
                                  <button onClick={() => handleResetPwd(u)} title="Reset password" className="rounded-md border border-border bg-panel-elevated p-1.5 text-muted-foreground hover:text-foreground">
                                    <Key className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(u)} disabled={u.id === me?.id} title="Hapus" className="rounded-md border border-destructive/40 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 disabled:opacity-40">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && (
                            <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Tidak ada pengguna.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none";
const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
