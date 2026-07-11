import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadAiRuntimeConfig } from "./ai-settings.functions";

const InputSchema = z.object({
  panel: z.string().min(1).max(80),
  data: z.string().min(1).max(8000),
});

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("OpenAI rate limit / kuota habis. Coba lagi sebentar.");
    if (res.status === 401) throw new Error("API key OpenAI tidak valid.");
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json?.choices?.[0]?.message?.content ?? "").trim();
}

async function callLovable(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY belum dikonfigurasi.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json?.choices?.[0]?.message?.content ?? "").trim();
}

export const generatePanelInsight = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const cfg = await loadAiRuntimeConfig();
    const system =
      "Anda adalah analis intelijen media profesional berbahasa Indonesia. Analisa data panel yang diberikan dengan singkat, tajam, dan actionable. Hindari spekulasi tanpa dasar. Gunakan teks biasa tanpa markdown heading.";
    const user = `Panel: ${data.panel}\n\nData:\n${data.data}\n\nBerikan analisa 2-3 paragraf pendek dalam Bahasa Indonesia mencakup: (1) pola utama yang terlihat, (2) insight / implikasi penting, (3) rekomendasi singkat untuk pemantauan atau tindak lanjut. Maksimal 180 kata.`;

    let insight: string;
    if (cfg.provider === "openai") {
      if (!cfg.openaiKey) throw new Error("API key OpenAI belum diset. Buka Profil → Pengaturan AI untuk memasukkan token.");
      insight = await callOpenAI(cfg.openaiKey, cfg.openaiModel, system, user);
    } else {
      insight = await callLovable(system, user);
    }
    return { insight, generatedAt: new Date().toISOString() };
  });
