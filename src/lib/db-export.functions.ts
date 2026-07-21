import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TABLES = [
  "app_settings",
  "keyword_queries",
  "news_articles",
  "rss_feeds",
  "sessions",
  "tracked_keywords",
  "user_roles",
  "users",
] as const;

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const exportDatabase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const result: Record<string, any[]> = {};
    const counts: Record<string, number> = {};

    for (const table of TABLES) {
      const rows: any[] = [];
      const pageSize = 1000;
      let from = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select("*")
          .range(from, from + pageSize - 1);
        if (error) {
          result[table] = [];
          counts[table] = 0;
          break;
        }
        if (!data || data.length === 0) break;
        rows.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      // mask sensitive key
      if (table === "app_settings") {
        for (const r of rows) {
          if (r.openai_api_key) r.openai_api_key = "***REDACTED***";
        }
      }
      result[table] = rows;
      counts[table] = rows.length;
    }

    return {
      exported_at: new Date().toISOString(),
      counts,
      tables: result,
    };
  });
