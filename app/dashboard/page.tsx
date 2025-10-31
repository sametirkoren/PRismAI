import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from "@/components/dashboard/sidebar";
import { PRList } from "@/components/dashboard/pr-list";
import { getUserRepos, getAllPRs } from "@/lib/actions/github";
import { TokenExpiredError } from "@/components/dashboard/token-expired-error";

interface PageProps {
  searchParams: Promise<{
    state?: 'open' | 'closed' | 'all';
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/");
  }

  const { state = 'open' } = await searchParams;
  
  let repos: Awaited<ReturnType<typeof getUserRepos>> = [];
  let prs: Awaited<ReturnType<typeof getAllPRs>> = [];
  let hasTokenError = false;
  
  try {
    repos = await getUserRepos();
  } catch (error) {
    if (error instanceof Error && (error.message === "GITHUB_TOKEN_EXPIRED" || error.message === "Unauthorized")) {
      hasTokenError = true;
    } else {
      throw error;
    }
  }
  
  if (!hasTokenError) {
    try {
      prs = await getAllPRs(undefined, undefined, state);
    } catch (error) {
      if (error instanceof Error && (error.message === "GITHUB_TOKEN_EXPIRED" || error.message === "Unauthorized")) {
        hasTokenError = true;
      } else {
        throw error;
      }
    }
  }
  
  if (hasTokenError) {
    return <TokenExpiredError />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar repos={repos} user={session.user} />
      <main className="flex-1 p-8">
        <PRList prs={prs} repos={repos} prState={state} />
      </main>
    </div>
  );
}
