import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

import appCss from "../styles.css?url";

const PUBLIC_ROUTES = ["/", "/auth"];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Monitoring Media & Analisis Sentiment AI" },
      {
        name: "description",
        content:
          "Platform monitoring berita & analisis sentiment berbasis AI untuk memahami opini publik dari berbagai sumber media di Indonesia secara real-time melalui RSS Feed.",
      },
      { name: "author", content: "PROPAM" },
      { property: "og:title", content: "Monitoring Media & Analisis Sentiment AI" },
      {
        property: "og:description",
        content:
          "Monitoring real-time RSS Feed media Indonesia dengan analisis sentiment berbasis AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Monitoring Media & Analisis Sentiment AI" },
      { name: "description", content: "Indo Sentiment Lens monitors Indonesian news and analyzes public opinion using AI." },
      { property: "og:description", content: "Indo Sentiment Lens monitors Indonesian news and analyzes public opinion using AI." },
      { name: "twitter:description", content: "Indo Sentiment Lens monitors Indonesian news and analyzes public opinion using AI." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/63633e1c-c2f2-4a89-b3b2-eacf246f822e/id-preview-e9a7dd48--4cf9fa0e-45c5-4162-a549-fe06870852e5.lovable.app-1776576746714.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/63633e1c-c2f2-4a89-b3b2-eacf246f822e/id-preview-e9a7dd48--4cf9fa0e-45c5-4162-a549-fe06870852e5.lovable.app-1776576746714.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { pathname } = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (!isPublic && !loading && !isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return <Outlet />;
}
