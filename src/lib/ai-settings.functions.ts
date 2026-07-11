import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AiProvider = "openai" | "lovable";

export type AiSettings = {
  ai_provider: AiProvider;
  openai_model: string;
  openai_image_model: string;
  has_openai_key: boolean;
  openai_key_masked: string | null;
  updated_at: string | null;
};

async function loadRaw() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function mask(k: string | null | undefined): string | null {
  if (!k) return null;
  if (k.length < 10) return "••••";
  return `${k.slice(0, 5)}…${k.slice(-4)}`;
}

/** Publicly (auth-only) readable — returns non-secret fields + masked key indicator. */
export const getAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<AiSettings> => {
    const row = await loadRaw();
    return {
      ai_provider: (row?.ai_provider as AiProvider) ?? "openai",
      openai_model: row?.openai_model ?? "gpt-4o-mini",
      openai_image_model: row?.openai_image_model ?? "gpt-image-1",
      has_openai_key: !!row?.openai_api_key,
      openai_key_masked: mask(row?.openai_api_key),
      updated_at: row?.updated_at ?? null,
    };
  });

const UpdateSchema = z.object({
  ai_provider: z.enum(["openai", "lovable"]).optional(),
  openai_api_key: z.string().min(0).max(500).optional(),
  openai_model: z.string().min(1).max(80).optional(),
  openai_image_model: z.string().min(1).max(80).optional(),
  clear_key: z.boolean().optional(),
});

export const updateAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: rErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (rErr) throw new Error(rErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const patch: Record<string, unknown> = { updated_by: context.userId };
    if (data.ai_provider) patch.ai_provider = data.ai_provider;
    if (data.openai_model) patch.openai_model = data.openai_model;
    if (data.openai_image_model) patch.openai_image_model = data.openai_image_model;
    if (data.clear_key) {
      patch.openai_api_key = null;
    } else if (typeof data.openai_api_key === "string" && data.openai_api_key.trim().length > 0) {
      const key = data.openai_api_key.trim();
      if (!key.startsWith("sk-")) throw new Error("Format API key OpenAI tidak valid (harus diawali 'sk-')");
      patch.openai_api_key = key;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ id: 1, ...patch }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Server-side helper for other server functions — returns full key (unsafe to expose). */
export async function loadAiRuntimeConfig(): Promise<{
  provider: AiProvider;
  openaiKey: string | null;
  openaiModel: string;
  openaiImageModel: string;
}> {
  const row = await loadRaw();
  return {
    provider: (row?.ai_provider as AiProvider) ?? "openai",
    openaiKey: row?.openai_api_key ?? process.env.OPENAI_API_KEY ?? null,
    openaiModel: row?.openai_model ?? "gpt-4o-mini",
    openaiImageModel: row?.openai_image_model ?? "gpt-image-1",
  };
}
