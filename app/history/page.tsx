import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ReviewHistory } from "@/components/history/review-history";
import { getUserRepos } from "@/lib/actions/github";

export default async function HistoryPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  // Get all reviews for this user
  const reviews = await prisma.review.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const repos = await getUserRepos();

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar repos={repos} user={session.user} />
      <main className="flex-1">
        <ReviewHistory reviews={reviews} />
      </main>
    </div>
  );
}
