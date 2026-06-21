import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  report: z.string().min(20),
  periode: z.string(),
  templateName: z.string(),
  filterAktif: z.string().nullable().optional(),
  total: z.number(),
  pctPos: z.number(),
  pctNeg: z.number(),
  pctNeu: z.number(),
  topKeywords: z.array(z.object({ name: z.string(), count: z.number() })).max(10),
  topSources: z.array(z.object({ name: z.string(), count: z.number() })).max(10),
  topCategories: z.array(z.object({ name: z.string(), count: z.number() })).max(10),
  topRegions: z.array(z.object({ name: z.string(), count: z.number() })).max(10),
});

const SlidesSchema = z.object({
  theme: z.object({
    primary: z.string().regex(/^[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^[0-9A-Fa-f]{6}$/),
    text: z.string().regex(/^[0-9A-Fa-f]{6}$/),
    muted: z.string().regex(/^[0-9A-Fa-f]{6}$/),
    fontHeading: z.string(),
    fontBody: z.string(),
    themeName: z.string(),
  }),
  slides: z
    .array(
      z.object({
        type: z.enum(["cover", "section", "bullets", "stat", "two-column", "closing"]),
        title: z.string(),
        subtitle: z.string().optional().nullable(),
        bullets: z.array(z.string()).optional().nullable(),
        leftTitle: z.string().optional().nullable(),
        leftBullets: z.array(z.string()).optional().nullable(),
        rightTitle: z.string().optional().nullable(),
        rightBullets: z.array(z.string()).optional().nullable(),
        stats: z
          .array(z.object({ label: z.string(), value: z.string(), hint: z.string().optional().nullable() }))
          .optional()
          .nullable(),
        footnote: z.string().optional().nullable(),
      }),
    )
    .min(5)
    .max(14),
});

export type PptSlidesPayload = z.infer<typeof SlidesSchema>;

export const generatePptStructure = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<PptSlidesPayload> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY tidak terkonfigurasi");

    const system = `Anda adalah desainer presentasi profesional untuk kantor pemerintah/intelijen media di Indonesia.
Tugas: Ubah laporan teks menjadi STRUKTUR SLIDE PowerPoint yang elegan, ringkas, formal, dan profesional.

Aturan:
- Output HANYA JSON valid sesuai skema (tanpa markdown, tanpa code fence).
- Bahasa Indonesia formal, padat, tanpa emoji.
- 8-12 slide total. Wajib ada: cover, ringkasan eksekutif (stat), beberapa bullets/two-column, dan closing.
- Setiap bullet maksimal ~14 kata. Maksimal 5 bullet per slide.
- Pilih palet warna profesional yang COCOK dengan konteks (intelijen media, pemerintahan). Hindari ungu/pink terang. Disarankan: navy, deep teal, charcoal, gold accent, atau forest green.
- Font: gunakan font sistem (Calibri, Georgia, Cambria, Arial, Trebuchet MS, Palatino).
- "background" sebaiknya terang (mis. FFFFFF atau F8F9FB) agar teks gelap mudah dibaca.
- "text" gelap, "muted" abu-abu.

Skema JSON yang harus diikuti persis:
{
  "theme": { "primary":"HEX6","secondary":"HEX6","accent":"HEX6","background":"HEX6","text":"HEX6","muted":"HEX6","fontHeading":"Calibri","fontBody":"Calibri","themeName":"Nama Tema" },
  "slides": [
    {"type":"cover","title":"...","subtitle":"...","footnote":"..."},
    {"type":"stat","title":"...","stats":[{"label":"...","value":"...","hint":"..."}]},
    {"type":"bullets","title":"...","bullets":["..."]},
    {"type":"two-column","title":"...","leftTitle":"...","leftBullets":["..."],"rightTitle":"...","rightBullets":["..."]},
    {"type":"section","title":"...","subtitle":"..."},
    {"type":"closing","title":"...","subtitle":"...","bullets":["..."]}
  ]
}`;

    const ctx = {
      periode: data.periode,
      template: data.templateName,
      filter: data.filterAktif ?? "Semua data",
      total: data.total,
      sentimen: { positif: data.pctPos, negatif: data.pctNeg, netral: data.pctNeu },
      keywords: data.topKeywords,
      sumber: data.topSources,
      kategori: data.topCategories,
      wilayah: data.topRegions,
      laporan: data.report.slice(0, 8000),
    };

    const user = `Buat struktur slide PowerPoint profesional dari laporan intelijen media berikut.
Konteks:
${JSON.stringify(ctx)}

Pastikan slide cover memuat: "LAPORAN INTELIJEN MEDIA", template "${data.templateName}", periode "${data.periode}".
Slide closing memuat rekomendasi/kesimpulan singkat.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
        max_tokens: 3000,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI rate limit tercapai. Coba lagi sebentar.");
      if (res.status === 402) throw new Error("Kredit AI habis. Hubungi administrator.");
      throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = (json?.choices?.[0]?.message?.content ?? "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // fallback: extract JSON block
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI tidak mengembalikan JSON valid");
      parsed = JSON.parse(m[0]);
    }
    return SlidesSchema.parse(parsed);
  });
