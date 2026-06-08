import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  page: z.string().min(1).max(64),
  context: z.string().min(1).max(8000),
  language: z.string().max(8).default("id"),
});

async function callLovableAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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
    if (res.status === 429) throw new Error("AI rate limit tercapai. Coba lagi sebentar.");
    if (res.status === 402) throw new Error("Kredit AI habis. Hubungi administrator.");
    throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json?.choices?.[0]?.message?.content ?? "").trim();
}

export const generateAnalysisNarrative = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const system =
      "Anda adalah analis intelijen media berbahasa Indonesia. Tulis narasi analitik yang jelas, ringkas, profesional, dan berbasis data yang diberikan. Hindari spekulasi tanpa dasar. Gunakan paragraf pendek dan kalimat tegas.";
    const user = `Halaman: ${data.page}\n\nData ringkas (JSON / bullet):\n${data.context}\n\nTulis narasi analisis 2-4 paragraf dalam Bahasa Indonesia yang mencakup: (1) gambaran umum kondisi, (2) temuan kunci dari data, (3) implikasi / risiko / peluang, (4) rekomendasi singkat. Jangan gunakan markdown heading, gunakan teks biasa.`;
    const narrative = await callLovableAI(system, user);
    return { narrative, generatedAt: new Date().toISOString() };
  });
