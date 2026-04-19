import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { HomeView } from "@/components/HomeView";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <HomeView />
    </div>
  );
}
