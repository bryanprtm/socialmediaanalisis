// Server-only RSS sync core. Do not import from client code.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { XMLParser } from "fast-xml-parser";

type ParsedItem = {
  title: string;
  url: string;
  excerpt: string | null;
  content: string | null;
  author: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
});

function pickText(node: unknown): string | null {
  if (node == null) return null;
  if (typeof node === "string") return node.trim() || null;
  if (typeof node === "object") {
    const n = node as Record<string, unknown>;
    if (typeof n["#text"] === "string") return (n["#text"] as string).trim() || null;
    if (typeof n["__cdata"] === "string") return (n["__cdata"] as string).trim() || null;
  }
  return null;
}

function stripHtml(s: string | null): string | null {
  if (!s) return s;
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || null;
}

function parseDate(s: string | null): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseFeed(xml: string): ParsedItem[] {
  let obj: any;
  try {
    obj = parser.parse(xml);
  } catch {
    return [];
  }
  const items: any[] = [];
  const rssItems = obj?.rss?.channel?.item;
  if (rssItems) items.push(...(Array.isArray(rssItems) ? rssItems : [rssItems]));
  const atomEntries = obj?.feed?.entry;
  if (atomEntries) items.push(...(Array.isArray(atomEntries) ? atomEntries : [atomEntries]));
  const rdfItems = obj?.["rdf:RDF"]?.item;
  if (rdfItems) items.push(...(Array.isArray(rdfItems) ? rdfItems : [rdfItems]));

  return items
    .map((it): ParsedItem | null => {
      const title = pickText(it.title);
      let url: string | null = null;
      if (typeof it.link === "string") url = it.link;
      else if (Array.isArray(it.link)) {
        const alt = it.link.find((l: any) => l?.["@_rel"] === "alternate") ?? it.link[0];
        url = alt?.["@_href"] ?? pickText(alt);
      } else if (it.link?.["@_href"]) url = it.link["@_href"];
      else url = pickText(it.link);
      if (!url) url = pickText(it.guid);
      if (!title || !url) return null;

      const desc = pickText(it.description) ?? pickText(it.summary) ?? pickText(it["content:encoded"]) ?? pickText(it.content);
      const content = pickText(it["content:encoded"]) ?? pickText(it.content) ?? desc;
      const author = pickText(it.author) ?? pickText(it["dc:creator"]);
      const cat = Array.isArray(it.category) ? pickText(it.category[0]) : pickText(it.category);
      const pub = pickText(it.pubDate) ?? pickText(it.published) ?? pickText(it.updated) ?? pickText(it["dc:date"]);

      let image: string | null = null;
      if (it.enclosure?.["@_url"] && String(it.enclosure["@_type"] ?? "").startsWith("image")) image = it.enclosure["@_url"];
      else if (it["media:content"]?.["@_url"]) image = it["media:content"]["@_url"];
      else if (it["media:thumbnail"]?.["@_url"]) image = it["media:thumbnail"]["@_url"];
      else if (content) {
        const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (m) image = m[1];
      }

      return {
        title: stripHtml(title) ?? title,
        url: url.trim(),
        excerpt: stripHtml(desc)?.slice(0, 500) ?? null,
        content: content ?? null,
        author: author ?? null,
        image_url: image,
        category: cat ?? null,
        published_at: parseDate(pub),
      };
    })
    .filter((x): x is ParsedItem => !!x);
}

export async function syncSingleFeedImpl(feedId: string): Promise<{ added: number; total: number; error?: string }> {
  const { data: feed, error: fErr } = await supabaseAdmin
    .from("rss_feeds")
    .select("id,name,url,category")
    .eq("id", feedId)
    .single();
  if (fErr || !feed) throw new Error(fErr?.message ?? "Feed not found");

  let xml: string;
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 TOC Sat Bantek-RSS-Reader/1.0", Accept: "application/rss+xml, application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    xml = await res.text();
  } catch (e: any) {
    await supabaseAdmin
      .from("rss_feeds")
      .update({ status: "error", health_score: 30, last_synced_at: new Date().toISOString() })
      .eq("id", feedId);
    return { added: 0, total: 0, error: e?.message ?? "fetch failed" };
  }

  const items = parseFeed(xml);
  if (items.length === 0) {
    await supabaseAdmin
      .from("rss_feeds")
      .update({ status: "warning", health_score: 60, last_synced_at: new Date().toISOString() })
      .eq("id", feedId);
    return { added: 0, total: 0, error: "No items parsed" };
  }

  const urls = items.map((i) => i.url);
  const { data: existing } = await supabaseAdmin
    .from("news_articles")
    .select("url")
    .in("url", urls);
  const seen = new Set((existing ?? []).map((r: any) => r.url));
  const toInsert = items
    .filter((i) => !seen.has(i.url))
    .map((i) => ({
      feed_id: feed.id,
      title: i.title.slice(0, 500),
      url: i.url,
      source: feed.name,
      category: i.category ?? feed.category,
      excerpt: i.excerpt,
      content: i.content,
      author: i.author,
      image_url: i.image_url,
      language: "id",
      keywords: [],
      published_at: i.published_at ?? new Date().toISOString(),
    }));

  let added = 0;
  if (toInsert.length > 0) {
    const { error: insErr, count } = await supabaseAdmin
      .from("news_articles")
      .insert(toInsert, { count: "exact" });
    if (insErr) {
      await supabaseAdmin
        .from("rss_feeds")
        .update({ status: "warning", health_score: 70, last_synced_at: new Date().toISOString() })
        .eq("id", feedId);
      return { added: 0, total: items.length, error: insErr.message };
    }
    added = count ?? toInsert.length;
  }

  await supabaseAdmin
    .from("rss_feeds")
    .update({ status: "active", health_score: 100, last_synced_at: new Date().toISOString() })
    .eq("id", feedId);

  return { added, total: items.length };
}

export async function syncAllFeedsImpl() {
  const { data: feeds, error } = await supabaseAdmin.from("rss_feeds").select("id");
  if (error) throw new Error(error.message);
  const results: Array<{ feedId: string; added: number; total: number; error?: string }> = [];
  for (const f of feeds ?? []) {
    try {
      const r = await syncSingleFeedImpl(f.id);
      results.push({ feedId: f.id, ...r });
    } catch (e: any) {
      results.push({ feedId: f.id, added: 0, total: 0, error: e?.message ?? "failed" });
    }
  }
  const totalAdded = results.reduce((s, r) => s + r.added, 0);
  const errors = results.filter((r) => r.error).length;
  return { totalAdded, feedCount: results.length, errors, results };
}
