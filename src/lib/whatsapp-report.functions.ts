import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  periode: z.string().default("Harian"),
  total: z.number().int().nonnegative(),
  positif: z.number().int().nonnegative(),
  negatif: z.number().int().nonnegative(),
  netral: z.number().int().nonnegative(),
  pctPos: z.number(),
  pctNeg: z.number(),
  pctNeu: z.number(),
  topKeywords: z.array(z.object({ name: z.string(), count: z.number() })).max(15),
  topSources: z.array(z.object({ name: z.string(), count: z.number() })).max(15),
  topCategories: z.array(z.object({ name: z.string(), count: z.number() })).max(15),
  topRegions: z.array(z.object({ name: z.string(), count: z.number() })).max(15),
  historis7Hari: z.array(z.number()).max(7),
  proyeksi7Hari: z.array(z.number().nullable()).max(7),
  filterAktif: z.string().nullable().optional(),
});

async function callAI(systemPrompt: string, userPrompt: string, max = 600): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: max,
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

export const generateWhatsAppReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const ctx = JSON.stringify(
      {
        total: data.total,
        sentiment: { positif: data.pctPos, negatif: data.pctNeg, netral: data.pctNeu },
        top_keywords: data.topKeywords.map((k) => `${k.name}(${k.count})`),
        top_sumber: data.topSources.map((k) => `${k.name}(${k.count})`),
        top_kategori: data.topCategories.map((k) => `${k.name}(${k.count})`),
        top_wilayah: data.topRegions.map((k) => `${k.name}(${k.count})`),
        historis_7_hari: data.historis7Hari,
        proyeksi_7_hari: data.proyeksi7Hari,
        filter_aktif: data.filterAktif ?? null,
      },
      null,
      2,
    );

    const system =
      "Anda adalah analis intelijen media POLRI/TOC Sat Bantek. Tulis Bahasa Indonesia formal, ringkas, profesional, dan tepat sasaran. Jangan menggunakan markdown atau heading. Output langsung paragraf saja, tanpa kata pembuka 'Berikut'.";

    const [analisis, prediksi, rekomendasi, kesimpulan] = await Promise.all([
      callAI(system, `Data:\n${ctx}\n\nTulis 1-2 paragraf 'Analisis AI' yang menjelaskan pola sentiment, sumber dominan, dan temuan kunci.`, 450),
      callAI(system, `Data:\n${ctx}\n\nTulis 1 paragraf 'Prediksi' tren 7 hari ke depan berdasarkan historis & proyeksi yang diberikan. Sebutkan arah & magnitude.`, 300),
      callAI(system, `Data:\n${ctx}\n\nTulis 'Rekomendasi' dalam 3-5 poin bernomor (1., 2., 3.) yang konkret, actionable, dan diprioritaskan berdasarkan severity.`, 400),
      callAI(system, `Data:\n${ctx}\n\nTulis 1 paragraf 'Kesimpulan' yang merangkum kondisi keseluruhan dan langkah prioritas.`, 250),
    ]);

    const tanggal = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });
    const periodeLabel = data.periode;

    const fakta: string[] = [];
    fakta.push(`• Total artikel terpantau: ${data.total}`);
    fakta.push(`• Sentiment positif: ${data.positif} (${data.pctPos}%)`);
    fakta.push(`• Sentiment negatif: ${data.negatif} (${data.pctNeg}%)`);
    fakta.push(`• Sentiment netral: ${data.netral} (${data.pctNeu}%)`);
    if (data.topKeywords[0]) fakta.push(`• Topik teratas: ${data.topKeywords.slice(0, 3).map((k) => `${k.name} (${k.count})`).join(", ")}`);
    if (data.topRegions[0]) fakta.push(`• Wilayah teratas: ${data.topRegions.slice(0, 3).map((k) => `${k.name} (${k.count})`).join(", ")}`);

    const sumberData =
      data.topSources.length > 0
        ? data.topSources.slice(0, 8).map((s) => `• ${s.name}: ${s.count} artikel`).join("\n")
        : "• Belum ada sumber terdata";

    const report = [
      `*LAPORAN INTELIJEN MEDIA — ${periodeLabel.toUpperCase()}*`,
      `_${tanggal}_`,
      data.filterAktif ? `_Filter aktif: ${data.filterAktif}_` : "",
      "",
      "*1. PENDAHULUAN*",
      `Laporan ${periodeLabel.toLowerCase()} ini menyajikan rangkuman pemantauan media yang dilakukan secara otomatis oleh sistem TOC Sat Bantek Command Center. Periode pengamatan mencakup ${data.total} artikel berita dari ${data.topSources.length} sumber media yang aktif.`,
      "",
      "*2. SUMBER DATA*",
      sumberData,
      "",
      "*3. RINGKASAN*",
      `Selama periode pengamatan, sistem mencatat ${data.total} artikel dengan komposisi sentiment positif ${data.pctPos}%, negatif ${data.pctNeg}%, dan netral ${data.pctNeu}%. Topik dominan berkisar pada ${data.topKeywords.slice(0, 3).map((k) => k.name).join(", ") || "—"}.`,
      "",
      "*4. FAKTA*",
      fakta.join("\n"),
      "",
      "*5. ANALISIS AI*",
      analisis || "(analisis tidak tersedia)",
      "",
      "*6. PREDIKSI*",
      prediksi || "(prediksi tidak tersedia)",
      "",
      "*7. REKOMENDASI*",
      rekomendasi || "(rekomendasi tidak tersedia)",
      "",
      "*8. KESIMPULAN*",
      kesimpulan || "(kesimpulan tidak tersedia)",
      "",
      "—",
      "_Disusun otomatis oleh TOC Sat Bantek Command Center · powered by Lovable AI_",
    ]
      .filter((line) => line !== undefined && line !== null)
      .join("\n");

    return { report, generatedAt: new Date().toISOString() };
  });
