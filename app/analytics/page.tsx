import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getUserRepos } from "@/lib/actions/github";
import { AnalyticsContent } from "@/components/analytics/analytics-content";

export default async function AnalyticsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/");
  }

  let repos: Awaited<ReturnType<typeof getUserRepos>> = [];
  
  try {
    repos = await getUserRepos();
  } catch (error) {
    console.error("Error fetching repos:", error);
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar repos={repos} user={session.user} />
      <main className="flex-1 p-8">
        <AnalyticsContent />
      </main>
    </div>
  );
}
