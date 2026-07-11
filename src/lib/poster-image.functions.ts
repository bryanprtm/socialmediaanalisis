import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadAiRuntimeConfig } from "./ai-settings.functions";


const InputSchema = z.object({
  templateName: z.string().min(1).max(80),
  periode: z.string().min(1).max(40),
  total: z.number().int().nonnegative(),
  pctPos: z.number(),
  pctNeg: z.number(),
  pctNeu: z.number(),
  topKeywords: z.array(z.string()).max(6),
});

export const generatePosterBackground = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const cfg = await loadAiRuntimeConfig();
    const apiKey = cfg.openaiKey;
    if (!apiKey) throw new Error("API key OpenAI belum diset. Buka Profil → Pengaturan AI untuk memasukkan token.");


    const prompt = `A premium, ultra-professional intelligence report poster background (1024x1536, portrait).
Theme: media monitoring & sentiment analysis dashboard for an Indonesian government intelligence unit ("TOC Sat Bantek").
Style: dark navy (#0B1B2B) base with subtle gold (#D4AF37) accents, cinematic depth, abstract data-visualization motifs — faint world map silhouette, faint network/graph lines, subtle bokeh, soft radial glow from upper-right.
NO TEXT, NO LETTERS, NO LOGOS, NO WORDS — absolutely none. Pure abstract background only.
Leave the central and lower areas relatively clean/uncluttered so data and typography can be overlaid on top.
Mood: authoritative, classified-document, modern editorial, high-end financial intelligence report.
Periode laporan: ${data.periode}. Topik dominan terkait: ${data.topKeywords.slice(0, 3).join(", ") || "umum"}.`;

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.openaiImageModel,
        prompt,
        size: "1024x1536",
        quality: "medium",
        n: 1,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      if (res.status === 401) throw new Error("API key OpenAI tidak valid.");
      if (res.status === 429) throw new Error("OpenAI rate limit / kuota habis.");
      throw new Error(`OpenAI image ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI tidak mengembalikan gambar.");
    return { imageBase64: b64, generatedAt: new Date().toISOString() };
  });
