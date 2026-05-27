import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

type Item = { id: string; text: string };
type Verdict = { id: string; sentiment: "positive" | "negative" | "neutral"; score: number };

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

async function classifyBatch(items: Item[]): Promise<Verdict[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const prompt = `Klasifikasikan sentimen setiap artikel berita Indonesia berikut. Balas HANYA JSON array tanpa markdown, format: [{"id":"...","sentiment":"positive|negative|neutral","score":-1..1}]. Score: -1 sangat negatif, 0 netral, 1 sangat positif.\n\nArtikel:\n${items
    .map((it) => `ID ${it.id}: ${it.text.replace(/\s+/g, " ").slice(0, 600)}`)
    .join("\n---\n")}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: "Anda adalah analis sentimen berita yang akurat dan ringkas. Balas hanya JSON valid." },
        { role: "user", content: prompt },
      ],
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((v: unknown): v is Verdict => {
        const x = v as Verdict;
        return (
          typeof x?.id === "string" &&
          (x.sentiment === "positive" || x.sentiment === "negative" || x.sentiment === "neutral") &&
          typeof x.score === "number"
        );
      })
      .map((v) => ({ ...v, score: Math.max(-1, Math.min(1, v.score)) }));
  } catch {
    return [];
  }
}

export const analyzeMissingSentiment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().min(1).max(500).default(200) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: rows, error } = await supabaseAdmin
      .from("news_articles")
      .select("id,title,excerpt")
      .is("sentiment", null)
      .order("published_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return { processed: 0, updated: 0, remaining: 0 };

    const batchSize = 15;
    let updated = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map((r: { id: string; title: string; excerpt: string | null }) => ({
        id: r.id,
        text: `${r.title}. ${r.excerpt ?? ""}`,
      }));
      let verdicts: Verdict[] = [];
      try {
        verdicts = await classifyBatch(batch);
      } catch (e) {
        console.error("[sentiment] batch failed", e);
        continue;
      }
      for (const v of verdicts) {
        const { error: uErr } = await supabaseAdmin
          .from("news_articles")
          .update({
            sentiment: v.sentiment,
            sentiment_score: v.score,
            confidence: Math.abs(v.score),
          })
          .eq("id", v.id);
        if (!uErr) updated++;
      }
    }

    const { count: remaining } = await supabaseAdmin
      .from("news_articles")
      .select("id", { count: "exact", head: true })
      .is("sentiment", null);

    return { processed: rows.length, updated, remaining: remaining ?? 0 };
  });
