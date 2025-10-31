import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SettingsContent } from "@/components/settings/settings-content";
import { getUserRepos } from "@/lib/actions/github";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const repos = await getUserRepos();

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar repos={repos} user={session.user} />
      <main className="flex-1">
        <SettingsContent />
      </main>
    </div>
  );
}
