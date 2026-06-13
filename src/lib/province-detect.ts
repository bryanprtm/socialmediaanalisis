// Detects Indonesian province from free-text (title/excerpt/content/source/region).
// Returns the canonical province name as used in public/indonesia-provinces.json (Propinsi field, uppercase).

export const PROVINCES: string[] = [
  "ACEH",
  "SUMATERA UTARA",
  "SUMATERA BARAT",
  "RIAU",
  "KEPULAUAN RIAU",
  "JAMBI",
  "BENGKULU",
  "SUMATERA SELATAN",
  "KEPULAUAN BANGKA BELITUNG",
  "LAMPUNG",
  "BANTEN",
  "DKI JAKARTA",
  "JAWA BARAT",
  "JAWA TENGAH",
  "DAERAH ISTIMEWA YOGYAKARTA",
  "JAWA TIMUR",
  "BALI",
  "NUSATENGGARA BARAT",
  "NUSATENGGARA TIMUR",
  "KALIMANTAN BARAT",
  "KALIMANTAN TENGAH",
  "KALIMANTAN SELATAN",
  "KALIMANTAN TIMUR",
  "KALIMANTAN UTARA",
  "SULAWESI UTARA",
  "GORONTALO",
  "SULAWESI TENGAH",
  "SULAWESI BARAT",
  "SULAWESI SELATAN",
  "SULAWESI TENGGARA",
  "MALUKU",
  "MALUKU UTARA",
  "PAPUA",
  "PAPUA BARAT",
  "IRIAN JAYA TIMUR",
];

// Aliases / city → province. Keys are lowercase; values are canonical province strings above.
const ALIAS: Record<string, string> = {
  // DKI / Jakarta
  "jakarta": "DKI JAKARTA",
  "dki": "DKI JAKARTA",
  "jakarta pusat": "DKI JAKARTA",
  "jakarta selatan": "DKI JAKARTA",
  "jakarta barat": "DKI JAKARTA",
  "jakarta timur": "DKI JAKARTA",
  "jakarta utara": "DKI JAKARTA",
  // Yogyakarta
  "yogyakarta": "DAERAH ISTIMEWA YOGYAKARTA",
  "jogja": "DAERAH ISTIMEWA YOGYAKARTA",
  "jogjakarta": "DAERAH ISTIMEWA YOGYAKARTA",
  "diy": "DAERAH ISTIMEWA YOGYAKARTA",
  "sleman": "DAERAH ISTIMEWA YOGYAKARTA",
  "bantul": "DAERAH ISTIMEWA YOGYAKARTA",
  "kulon progo": "DAERAH ISTIMEWA YOGYAKARTA",
  "gunungkidul": "DAERAH ISTIMEWA YOGYAKARTA",
  // Jawa Barat
  "bandung": "JAWA BARAT",
  "bogor": "JAWA BARAT",
  "depok": "JAWA BARAT",
  "bekasi": "JAWA BARAT",
  "cimahi": "JAWA BARAT",
  "cirebon": "JAWA BARAT",
  "sukabumi": "JAWA BARAT",
  "garut": "JAWA BARAT",
  "tasikmalaya": "JAWA BARAT",
  "karawang": "JAWA BARAT",
  "purwakarta": "JAWA BARAT",
  "subang": "JAWA BARAT",
  "indramayu": "JAWA BARAT",
  "kuningan": "JAWA BARAT",
  "majalengka": "JAWA BARAT",
  // Banten
  "tangerang": "BANTEN",
  "serang": "BANTEN",
  "cilegon": "BANTEN",
  "lebak": "BANTEN",
  "pandeglang": "BANTEN",
  // Jawa Tengah
  "semarang": "JAWA TENGAH",
  "solo": "JAWA TENGAH",
  "surakarta": "JAWA TENGAH",
  "magelang": "JAWA TENGAH",
  "pekalongan": "JAWA TENGAH",
  "tegal": "JAWA TENGAH",
  "salatiga": "JAWA TENGAH",
  "kudus": "JAWA TENGAH",
  "purwokerto": "JAWA TENGAH",
  "banyumas": "JAWA TENGAH",
  "cilacap": "JAWA TENGAH",
  "brebes": "JAWA TENGAH",
  "batang": "JAWA TENGAH",
  "jepara": "JAWA TENGAH",
  "demak": "JAWA TENGAH",
  "klaten": "JAWA TENGAH",
  "boyolali": "JAWA TENGAH",
  "sragen": "JAWA TENGAH",
  "kebumen": "JAWA TENGAH",
  // Jawa Timur
  "surabaya": "JAWA TIMUR",
  "malang": "JAWA TIMUR",
  "sidoarjo": "JAWA TIMUR",
  "gresik": "JAWA TIMUR",
  "kediri": "JAWA TIMUR",
  "madiun": "JAWA TIMUR",
  "blitar": "JAWA TIMUR",
  "probolinggo": "JAWA TIMUR",
  "pasuruan": "JAWA TIMUR",
  "mojokerto": "JAWA TIMUR",
  "jember": "JAWA TIMUR",
  "banyuwangi": "JAWA TIMUR",
  "tulungagung": "JAWA TIMUR",
  "lamongan": "JAWA TIMUR",
  "tuban": "JAWA TIMUR",
  "bojonegoro": "JAWA TIMUR",
  "madura": "JAWA TIMUR",
  "pamekasan": "JAWA TIMUR",
  "sumenep": "JAWA TIMUR",
  "bangkalan": "JAWA TIMUR",
  // Bali
  "denpasar": "BALI",
  "badung": "BALI",
  "gianyar": "BALI",
  "buleleng": "BALI",
  "tabanan": "BALI",
  "klungkung": "BALI",
  "karangasem": "BALI",
  "jembrana": "BALI",
  "ubud": "BALI",
  "kuta": "BALI",
  // NTB / NTT
  "mataram": "NUSATENGGARA BARAT",
  "lombok": "NUSATENGGARA BARAT",
  "sumbawa": "NUSATENGGARA BARAT",
  "bima": "NUSATENGGARA BARAT",
  "ntb": "NUSATENGGARA BARAT",
  "nusa tenggara barat": "NUSATENGGARA BARAT",
  "kupang": "NUSATENGGARA TIMUR",
  "flores": "NUSATENGGARA TIMUR",
  "sumba": "NUSATENGGARA TIMUR",
  "timor": "NUSATENGGARA TIMUR",
  "ntt": "NUSATENGGARA TIMUR",
  "nusa tenggara timur": "NUSATENGGARA TIMUR",
  // Sumatera
  "banda aceh": "ACEH",
  "lhokseumawe": "ACEH",
  "sabang": "ACEH",
  "medan": "SUMATERA UTARA",
  "deli serdang": "SUMATERA UTARA",
  "binjai": "SUMATERA UTARA",
  "pematangsiantar": "SUMATERA UTARA",
  "tapanuli": "SUMATERA UTARA",
  "padang": "SUMATERA BARAT",
  "bukittinggi": "SUMATERA BARAT",
  "payakumbuh": "SUMATERA BARAT",
  "pariaman": "SUMATERA BARAT",
  "pekanbaru": "RIAU",
  "dumai": "RIAU",
  "batam": "KEPULAUAN RIAU",
  "tanjung pinang": "KEPULAUAN RIAU",
  "kepri": "KEPULAUAN RIAU",
  "palembang": "SUMATERA SELATAN",
  "lubuklinggau": "SUMATERA SELATAN",
  "prabumulih": "SUMATERA SELATAN",
  "bandar lampung": "LAMPUNG",
  "metro": "LAMPUNG",
  "bengkulu": "BENGKULU",
  "jambi": "JAMBI",
  "pangkalpinang": "KEPULAUAN BANGKA BELITUNG",
  "pangkal pinang": "KEPULAUAN BANGKA BELITUNG",
  "bangka": "KEPULAUAN BANGKA BELITUNG",
  "belitung": "KEPULAUAN BANGKA BELITUNG",
  "babel": "KEPULAUAN BANGKA BELITUNG",
  // Kalimantan
  "pontianak": "KALIMANTAN BARAT",
  "singkawang": "KALIMANTAN BARAT",
  "palangkaraya": "KALIMANTAN TENGAH",
  "palangka raya": "KALIMANTAN TENGAH",
  "banjarmasin": "KALIMANTAN SELATAN",
  "banjarbaru": "KALIMANTAN SELATAN",
  "samarinda": "KALIMANTAN TIMUR",
  "balikpapan": "KALIMANTAN TIMUR",
  "bontang": "KALIMANTAN TIMUR",
  "ikn": "KALIMANTAN TIMUR",
  "nusantara": "KALIMANTAN TIMUR",
  "tarakan": "KALIMANTAN UTARA",
  "nunukan": "KALIMANTAN UTARA",
  // Sulawesi
  "manado": "SULAWESI UTARA",
  "bitung": "SULAWESI UTARA",
  "tomohon": "SULAWESI UTARA",
  "minahasa": "SULAWESI UTARA",
  "gorontalo": "GORONTALO",
  "palu": "SULAWESI TENGAH",
  "poso": "SULAWESI TENGAH",
  "mamuju": "SULAWESI BARAT",
  "makassar": "SULAWESI SELATAN",
  "parepare": "SULAWESI SELATAN",
  "pare-pare": "SULAWESI SELATAN",
  "kendari": "SULAWESI TENGGARA",
  "baubau": "SULAWESI TENGGARA",
  "bau-bau": "SULAWESI TENGGARA",
  // Maluku & Papua
  "ambon": "MALUKU",
  "tual": "MALUKU",
  "ternate": "MALUKU UTARA",
  "tidore": "MALUKU UTARA",
  "jayapura": "PAPUA",
  "merauke": "PAPUA",
  "biak": "PAPUA",
  "timika": "PAPUA",
  "wamena": "PAPUA",
  "nabire": "PAPUA",
  "manokwari": "PAPUA BARAT",
  "sorong": "PAPUA BARAT",
  "fakfak": "PAPUA BARAT",
  "raja ampat": "PAPUA BARAT",
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/daerah istimewa|daerah khusus ibukota|provinsi|prov\.?/g, "")
    .replace(/[^a-z]/g, "")
    .trim();
}

const PROV_KEYS: Array<{ canon: string; key: string }> = PROVINCES.map((p) => ({
  canon: p,
  key: normalize(p),
}));

/** Match a free-form region string to a canonical province name. */
export function matchProvinceName(region: string | null | undefined): string | null {
  if (!region) return null;
  const t = region.toLowerCase().trim();
  if (ALIAS[t]) return ALIAS[t];
  const norm = normalize(region);
  if (!norm) return null;
  for (const { canon, key } of PROV_KEYS) {
    if (key === norm || norm.includes(key) || key.includes(norm)) return canon;
  }
  return null;
}

/** Detect province by scanning free text for province names or known city aliases. */
export function detectProvinceFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const lower = ` ${text.toLowerCase()} `;
  // Direct province name hit (longest first)
  const sorted = [...PROVINCES].sort((a, b) => b.length - a.length);
  for (const p of sorted) {
    const display = p.toLowerCase();
    if (lower.includes(` ${display} `) || lower.includes(`${display},`)) return p;
    // try common short forms
    const short = display.replace(/^daerah istimewa\s+/, "").replace(/^kepulauan\s+/, "");
    if (short !== display && (lower.includes(` ${short} `) || lower.includes(`${short},`))) return p;
  }
  // Alias / city hit
  for (const [alias, canon] of Object.entries(ALIAS)) {
    if (lower.includes(` ${alias} `) || lower.includes(`${alias},`) || lower.includes(`${alias}.`)) {
      return canon;
    }
  }
  return null;
}

/** Resolve province for an article, preferring explicit region, then scanning text fields. */
export function resolveArticleProvince(a: {
  region?: string | null;
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  source?: string | null;
}): string | null {
  return (
    matchProvinceName(a.region) ??
    detectProvinceFromText(a.title) ??
    detectProvinceFromText(a.excerpt) ??
    detectProvinceFromText(a.content) ??
    null
  );
}
