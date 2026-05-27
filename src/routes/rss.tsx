import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, Panel, MetricCard, Pill } from "@/components/PageShell";
import { Rss, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Globe, LogIn, Pencil, Save, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { syncRssFeed, syncAllRssFeeds } from "@/lib/rss-sync.functions";

export const Route = createFileRoute("/rss")({
  head: () => ({
    meta: [
      { title: "RSS Manager — PROPAM" },
      { name: "description", content: "Kelola sumber RSS feed yang aktif dipantau." },
    ],
  }),
  component: Page,
});

type FeedStatus = "active" | "warning" | "error";
type Feed = {
  id: string;
  name: string;
  url: string;
  category: string | null;
  status: FeedStatus;
  health_score: number;
  last_synced_at: string | null;
};

const empty = { name: "", url: "", category: "" };

function timeAgo(iso: string | null) {
  if (!iso) return "Belum sync";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

function Page() {
  const { isAuthenticated } = useAuth();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Feed>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const syncOneFn = useServerFn(syncRssFeed);
  const syncAllFn = useServerFn(syncAllRssFeeds);

  async function syncOne(id: string) {
    setSyncing(id);
    try {
      const r = await syncOneFn({ data: { feedId: id } });
      if (r.error) toast.warning(`Sync selesai dengan peringatan: ${r.error}`);
      else toast.success(`Sync berhasil: +${r.added} berita baru (dari ${r.total})`);
    } catch (e: any) {
      toast.error(e?.message ?? "Sync gagal");
    } finally {
      setSyncing(null);
    }
  }

  async function syncAll() {
    setSyncingAll(true);
    try {
      const r = await syncAllFn();
      toast.success(`Sync selesai: +${r.totalAdded} berita baru dari ${r.feedCount} feed${r.errors ? ` (${r.errors} error)` : ""}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Sync gagal");
    } finally {
      setSyncingAll(false);
    }
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("rss_feeds").select("*").order("name");
    if (error) toast.error(error.message);
    else setFeeds((data ?? []) as Feed[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("rss-feeds")
      .on("postgres_changes", { event: "*", schema: "public", table: "rss_feeds" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function addFeed(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.url) return toast.error("Nama & URL wajib diisi");
    setSubmitting(true);
    const { error } = await supabase.from("rss_feeds").insert({
      name: form.name,
      url: form.url,
      category: form.category || null,
      status: "active",
      health_score: 100,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("RSS feed ditambahkan");
    setForm(empty);
  }

  async function saveEdit() {
    if (!editId) return;
    const { error } = await supabase
      .from("rss_feeds")
      .update({
        name: draft.name,
        url: draft.url,
        category: draft.category || null,
      })
      .eq("id", editId);
    if (error) return toast.error(error.message);
    toast.success("Feed diperbarui");
    setEditId(null);
    setDraft({});
  }

  async function removeFeed(id: string) {
    if (!confirm("Hapus RSS feed ini?")) return;
    const { error } = await supabase.from("rss_feeds").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Feed dihapus");
  }

  const total = feeds.length;
  const active = feeds.filter((f) => f.status === "active").length;
  const warnings = feeds.filter((f) => f.status === "warning").length;
  const errors = feeds.filter((f) => f.status === "error").length;

  return (
    <PageShell
      eyebrow="Data Pipeline"
      title="RSS Manager"
      description="Kelola sumber RSS feed yang aktif dipantau pipeline berita."
      actions={
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button onClick={syncAll} disabled={syncingAll} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-3 py-2 text-xs font-semibold text-background disabled:opacity-50">
              <Download className={`h-3.5 w-3.5 ${syncingAll ? "animate-bounce" : ""}`} /> {syncingAll ? "Syncing…" : "Sync Semua"}
            </button>
          )}
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      }
    >
      {!isAuthenticated && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-foreground">Login untuk menambah, mengedit, atau menghapus RSS feed.</p>
          </div>
          <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-3 py-1.5 text-xs font-semibold text-background">
            <LogIn className="h-3.5 w-3.5" /> Login
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total RSS Feed" value={String(total)} icon={<Rss className="h-5 w-5" />} accent="cyan" />
        <MetricCard label="Feed Aktif" value={String(active)} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" />
        <MetricCard label="Warning" value={String(warnings)} icon={<AlertCircle className="h-5 w-5" />} accent="amber" />
        <MetricCard label="Error" value={String(errors)} icon={<AlertCircle className="h-5 w-5" />} accent="danger" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="RSS Feed Sources" icon={<Rss className="h-4 w-4" />} action={<Pill tone="positive">{active}/{total} Online</Pill>}>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Memuat feed…</div>
          ) : feeds.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Belum ada RSS feed. Tambahkan di panel sebelah kanan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Source</th>
                    <th className="px-2 py-2 font-medium">Kategori</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Last Sync</th>
                    <th className="px-2 py-2 font-medium">Health</th>
                    <th className="px-2 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {feeds.map((f) => {
                    const editing = editId === f.id;
                    if (editing) {
                      return (
                        <tr key={f.id} className="bg-panel-elevated">
                          <td className="px-2 py-3" colSpan={6}>
                            <div className="space-y-2">
                              <input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nama" className="h-9 w-full rounded-lg border border-primary/40 bg-background px-3 text-sm text-foreground focus:outline-none" />
                              <input value={draft.url ?? ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="URL" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-mono text-foreground focus:outline-none" />
                              <input value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Kategori" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none" />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setEditId(null); setDraft({}); }} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /> Batal</button>
                                <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded-md bg-gradient-cyan px-3 py-1.5 text-xs font-semibold text-background"><Save className="h-3.5 w-3.5" /> Simpan</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={f.id} className="text-sm hover:bg-panel-elevated">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-2 w-2 rounded-full ${f.status === "active" ? "bg-success animate-pulse-dot" : f.status === "warning" ? "bg-warning" : "bg-destructive"}`} />
                            <div>
                              <p className="font-semibold text-foreground">{f.name}</p>
                              <p className="font-mono text-[10px] text-muted-foreground break-all">{f.url}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3"><Pill tone="info">{f.category ?? "—"}</Pill></td>
                        <td className="px-2 py-3"><Pill tone={f.status === "active" ? "positive" : f.status === "warning" ? "warning" : "negative"}>{f.status}</Pill></td>
                        <td className="px-2 py-3 font-mono text-xs text-muted-foreground">{timeAgo(f.last_synced_at)}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div className={`h-full ${f.health_score >= 80 ? "bg-success" : f.health_score >= 50 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${f.health_score}%` }} />
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">{f.health_score}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          {isAuthenticated && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditId(f.id); setDraft({ name: f.name, url: f.url, category: f.category }); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/15 hover:text-primary" aria-label="edit"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => removeFeed(f.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive" aria-label="delete"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Tambah RSS Feed" icon={<Plus className="h-4 w-4" />}>
          {!isAuthenticated ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <LogIn className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Login untuk menambah RSS feed.</p>
              <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-cyan px-4 py-2 text-xs font-semibold text-background"><LogIn className="h-3.5 w-3.5" /> Login</Link>
            </div>
          ) : (
            <form onSubmit={addFeed} className="space-y-2.5">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama Feed *" className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none" />
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} type="url" placeholder="URL RSS *" className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none" />
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Kategori (NAT, INTL, REG, CUSTOM)" className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none" />
              <button disabled={submitting} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-cyan text-xs font-semibold text-background disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" /> {submitting ? "Menyimpan…" : "Tambah Feed"}
              </button>
            </form>
          )}
          <div className="mt-4 rounded-lg border border-border bg-panel-elevated p-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">{total} RSS source aktif</p>
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">Real-time sync via Supabase</p>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
