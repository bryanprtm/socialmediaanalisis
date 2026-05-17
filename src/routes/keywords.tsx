import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, Panel, Pill, MetricCard } from "@/components/PageShell";
import { Search, Plus, Pencil, Trash2, Save, X, CheckCircle2, AlertCircle, KeyRound, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { evalExpression, extractTerms, validateExpression } from "@/lib/keyword-query";
import { useActiveKeyword, KeywordQuery } from "@/hooks/use-active-keyword";

export const Route = createFileRoute("/keywords")({
  head: () => ({
    meta: [
      { title: "Keyword Queries — Boolean Search Builder" },
      { name: "description", content: "Kelola kata kunci pencarian dengan rumus boolean IF, AND, OR, NOT." },
    ],
  }),
  component: Page,
});

const emptyForm = { name: "", expression: "", description: "" };

const OPERATORS = ["AND", "OR", "NOT", "IF", "(", ")"] as const;

function Page() {
  const { queries, active, setActiveId, reload } = useActiveKeyword();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(emptyForm);
  const [testText, setTestText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { reload(); }, [reload]);

  function insertToken(target: "new" | "edit", token: string) {
    if (target === "new") {
      setForm((f) => ({ ...f, expression: (f.expression + " " + token).trim() }));
    } else {
      setEditDraft((d) => ({ ...d, expression: (d.expression + " " + token).trim() }));
    }
  }

  async function addQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.expression.trim()) return toast.error("Nama & ekspresi wajib diisi");
    const v = validateExpression(form.expression);
    if (!v.ok) return toast.error("Ekspresi invalid: " + v.error);
    setSubmitting(true);
    const { error } = await supabase.from("keyword_queries").insert({
      name: form.name.trim(),
      expression: form.expression.trim(),
      terms: extractTerms(form.expression),
      description: form.description.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Kata kunci ditambahkan");
    setForm(emptyForm);
  }

  function startEdit(q: KeywordQuery) {
    setEditingId(q.id);
    setEditDraft({ name: q.name, expression: q.expression, description: q.description ?? "" });
  }

  async function saveEdit() {
    if (!editingId) return;
    const v = validateExpression(editDraft.expression);
    if (!v.ok) return toast.error("Ekspresi invalid: " + v.error);
    const { error } = await supabase
      .from("keyword_queries")
      .update({
        name: editDraft.name.trim(),
        expression: editDraft.expression.trim(),
        terms: extractTerms(editDraft.expression),
        description: editDraft.description.trim() || null,
      })
      .eq("id", editingId);
    if (error) return toast.error(error.message);
    toast.success("Kata kunci diperbarui");
    setEditingId(null);
  }

  async function deleteQuery(id: string) {
    if (!confirm("Hapus kata kunci ini?")) return;
    const { error } = await supabase.from("keyword_queries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (active?.id === id) setActiveId(null);
    toast.success("Kata kunci dihapus");
  }

  const formValid = form.expression.trim() ? validateExpression(form.expression) : { ok: true as const };

  return (
    <PageShell
      eyebrow="Keyword Builder"
      title="Kata Kunci Pencarian"
      description="Kelola query kata kunci dengan rumus boolean (IF, AND, OR, NOT). Query yang dipilih di sini berlaku global ke seluruh halaman analisis."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Query" value={String(queries.length)} icon={<KeyRound className="h-5 w-5" />} accent="cyan" />
        <MetricCard label="Query Aktif" value={active ? "1" : "0"} icon={<Sparkles className="h-5 w-5" />} accent="violet" hint={active?.name ?? "Belum dipilih"} />
        <MetricCard label="Total Terms" value={String(queries.reduce((n, q) => n + q.terms.length, 0))} icon={<Search className="h-5 w-5" />} accent="amber" />
        <MetricCard label="Operator Didukung" value="4" icon={<CheckCircle2 className="h-5 w-5" />} accent="success" hint="IF · AND · OR · NOT" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Daftar Kata Kunci" icon={<KeyRound className="h-4 w-4" />}>
          {queries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <KeyRound className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada query. Tambahkan di panel kanan.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {queries.map((q) => {
                const isEditing = editingId === q.id;
                const isActive = active?.id === q.id;
                if (isEditing) {
                  return (
                    <li key={q.id} className="space-y-2 py-4">
                      <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} placeholder="Nama" className="h-9 w-full rounded-lg border border-primary/40 bg-panel-elevated px-3 text-sm text-foreground focus:outline-none" />
                      <textarea value={editDraft.expression} onChange={(e) => setEditDraft({ ...editDraft, expression: e.target.value })} rows={2} placeholder="Ekspresi boolean" className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 font-mono text-xs text-foreground focus:outline-none" />
                      <div className="flex flex-wrap gap-1.5">
                        {OPERATORS.map((op) => (
                          <button key={op} type="button" onClick={() => insertToken("edit", op)} className="rounded-md border border-border bg-panel-elevated px-2 py-0.5 font-mono text-[10px] text-primary hover:border-primary/40">
                            {op}
                          </button>
                        ))}
                      </div>
                      <input value={editDraft.description} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} placeholder="Deskripsi (opsional)" className="h-9 w-full rounded-lg border border-border bg-panel-elevated px-3 text-xs text-foreground focus:outline-none" />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-1 rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" /> Batal
                        </button>
                        <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded-md bg-gradient-cyan px-3 py-1.5 text-xs font-semibold text-background">
                          <Save className="h-3.5 w-3.5" /> Simpan
                        </button>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={q.id} className="group py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm font-semibold text-foreground">{q.name}</h3>
                          {isActive && <Pill tone="positive">AKTIF</Pill>}
                        </div>
                        <code className="mt-1.5 block break-all rounded-md border border-border bg-panel-elevated px-2 py-1.5 font-mono text-xs text-primary">
                          {q.expression}
                        </code>
                        {q.description && <p className="mt-1.5 text-xs text-muted-foreground">{q.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {q.terms.map((t) => (
                            <span key={t} className="rounded-full border border-border bg-panel-elevated px-2 py-0.5 font-mono text-[10px] text-muted-foreground">#{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveId(isActive ? null : q.id)}
                          className={`rounded-md p-1.5 transition ${isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-primary/15 hover:text-primary"}`}
                          aria-label="Toggle aktif"
                          title={isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => startEdit(q)} className="rounded-md p-1.5 text-muted-foreground transition hover:bg-primary/15 hover:text-primary" aria-label="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteQuery(q.id)} className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive" aria-label="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Tambah Query Baru" icon={<Plus className="h-4 w-4" />}>
            <form onSubmit={addQuery} className="space-y-2.5">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama query *" className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none" />
              <textarea
                value={form.expression}
                onChange={(e) => setForm({ ...form, expression: e.target.value })}
                placeholder='Contoh: jakarta AND (banjir OR macet) NOT politik'
                rows={3}
                className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {OPERATORS.map((op) => (
                  <button key={op} type="button" onClick={() => insertToken("new", op)} className="rounded-md border border-border bg-panel-elevated px-2.5 py-1 font-mono text-[11px] font-semibold text-primary hover:border-primary/40">
                    {op}
                  </button>
                ))}
              </div>
              {form.expression && !formValid.ok && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> {formValid.error}
                </p>
              )}
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat (opsional)" className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none" />
              <button disabled={submitting} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-cyan text-xs font-semibold text-background disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" /> {submitting ? "Menyimpan…" : "Tambah Query"}
              </button>
            </form>
          </Panel>

          <Panel title="Uji Ekspresi" icon={<Search className="h-4 w-4" />}>
            <p className="mb-2 text-xs text-muted-foreground">
              Tempel teks contoh untuk mengecek apakah cocok dengan query yang dipilih.
            </p>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={3}
              placeholder="Contoh kalimat berita…"
              className="w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground focus:outline-none"
            />
            <div className="mt-2 space-y-1">
              {queries.length === 0 && <p className="text-xs text-muted-foreground">Belum ada query.</p>}
              {queries.map((q) => {
                const match = testText ? evalExpression(q.expression, testText) : null;
                return (
                  <div key={q.id} className="flex items-center justify-between rounded-md border border-border bg-panel-elevated px-2.5 py-1.5">
                    <span className="text-xs text-foreground">{q.name}</span>
                    {match === null ? (
                      <span className="font-mono text-[10px] text-muted-foreground">—</span>
                    ) : match ? (
                      <Pill tone="positive">MATCH</Pill>
                    ) : (
                      <Pill tone="negative">NO MATCH</Pill>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
