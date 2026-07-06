import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/sync-rss")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: apikey header must match the Supabase publishable/anon key.
        const apiKey = request.headers.get("apikey") ?? request.headers.get("x-api-key");
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        try {
          const { syncAllFeedsImpl } = await import("@/lib/rss-sync.server");
          const result = await syncAllFeedsImpl();
          return new Response(
            JSON.stringify({ ok: true, at: new Date().toISOString(), ...result }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        } catch (e: any) {
          return new Response(
            JSON.stringify({ ok: false, error: e?.message ?? "sync failed" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
      GET: async () =>
        new Response(
          JSON.stringify({ ok: true, hint: "POST with apikey header to trigger sync" }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    },
  },
});
