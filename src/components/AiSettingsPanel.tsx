import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/PageShell";
import { getAiSettings, updateAiSettings, type AiSettingsPublic } from "@/lib/ai-settings.functions";

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

export function AiSettingsPanel() {
  const fetchAi = useServerFn(getAiSettings);
  const saveAi = useServerFn(updateAiSettings);
  const [ai, setAi] = useState<AiSettingsPublic | null>(null);
  const [form, setForm] = useState({ provider: "openai" as "openai" | "lovable", key: "", model: "gpt-4o-mini", imageModel: "gpt-image-1" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    try {
      const a = await fetchAi();
      setAi(a);
      setForm((f) => ({ ...f, provider: a.ai_provider, model: a.openai_model, imageModel: a.openai_image_model }));
    } catch (e: any) {
      if (String(e?.message ?? "").toLowerCase().includes("forbidden") || String(e?.message ?? "").includes("admin")) {
        setForbidden(true);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAi({ data: {
        ai_provider: form.provider,
        openai_model: form.model,
        openai_image_model: form.imageModel,
        openai_api_key: form.key || undefined,
      } });
      toast.success("Pengaturan AI tersimpan");
      setForm((f) => ({ ...f, key: "" }));
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!confirm("Hapus token OpenAI yang tersimpan?")) return;
    try {
      await saveAi({ data: { clear_key: true } });
      toast.success("Token dihapus");
      await load();
    } catch (e: any) { toast.error(e.message); }
  }

  if (loading) {
    return (
      <Panel title="AI Provider & Token" icon={<Sparkles className="h-4 w-4" />}>
        <p className="text-sm text-muted-foreground">Memuat…</p>
      </Panel>
    );
  }
  if (forbidden) {
    return (
      <Panel title="AI Provider & Token" icon={<Sparkles className="h-4 w-4" />}>
        <p className="text-sm text-muted-foreground">Hanya admin yang dapat mengubah pengaturan AI.</p>
      </Panel>
    );
  }

  return (
    <Panel className="lg:col-span-2" title="AI Provider & Token" icon={<Sparkles className="h-4 w-4" />}>
      <p className="mb-3 text-xs text-muted-foreground">
        Pilih provider AI untuk analisa (narasi, insight panel, poster). Untuk deployment di VPS, pilih <span className="font-semibold text-foreground">OpenAI</span> dan masukkan token OpenAI Anda — tidak perlu API key Lovable. Pilih <span className="font-semibold text-foreground">Lovable AI Gateway</span> bila ingin memakai LOVABLE_API_KEY bawaan.
      </p>
      <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
        <Field label="Provider AI">
          <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as "openai" | "lovable" })} className={inputCls}>
            <option value="openai">OpenAI (masukkan token sendiri)</option>
            <option value="lovable">Lovable AI Gateway (LOVABLE_API_KEY)</option>
          </select>
        </Field>
        <Field label="Model Teks (OpenAI)">
          <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputCls} disabled={form.provider !== "openai"}>
            <option value="gpt-4o-mini">gpt-4o-mini (murah & cepat)</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4.1-mini">gpt-4.1-mini</option>
            <option value="gpt-4.1">gpt-4.1</option>
          </select>
        </Field>
        <Field label="Model Gambar (Poster)">
          <select value={form.imageModel} onChange={(e) => setForm({ ...form, imageModel: e.target.value })} className={inputCls} disabled={form.provider !== "openai"}>
            <option value="gpt-image-1">gpt-image-1</option>
            <option value="dall-e-3">dall-e-3</option>
          </select>
        </Field>
        <Field label={ai?.has_openai_key ? `Token OpenAI (tersimpan: ${ai.openai_key_masked})` : "Token OpenAI (sk-…)"}>
          <input
            type="password"
            autoComplete="off"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder={ai?.has_openai_key ? "Isi untuk mengganti token" : "sk-proj-..."}
            className={inputCls}
          />
        </Field>
        <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {ai?.updated_at ? `Diperbarui: ${new Date(ai.updated_at).toLocaleString("id-ID")}` : "Belum pernah dikonfigurasi"}
            {" · "}Status: {ai?.has_openai_key ? "Token OpenAI aktif" : "Belum ada token"}
          </p>
          <div className="flex gap-2">
            {ai?.has_openai_key && (
              <button type="button" onClick={handleClear} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive hover:bg-destructive/20">
                <Trash2 className="h-3.5 w-3.5" /> Hapus Token
              </button>
            )}
            <button disabled={saving} className={btnPrimary}>
              <Save className="h-3.5 w-3.5" /> {saving ? "Menyimpan…" : "Simpan Pengaturan"}
            </button>
          </div>
        </div>
      </form>
    </Panel>
  );
}
