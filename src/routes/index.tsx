import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { HomeView } from "@/components/HomeView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TOC Sat Bantek Command Center — Home" },
      { name: "description", content: "Pusat kendali monitoring media & analisis sentiment AI Indonesia secara real-time." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <TopNav />
      <HomeView />
    </>
  );
}
