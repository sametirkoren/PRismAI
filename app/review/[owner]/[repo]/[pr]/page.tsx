import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPRDetails } from "@/lib/actions/github";
import { ReviewTypeSelection } from "@/components/review/review-type-selection";
import { prisma } from "@/lib/prisma";

interface ReviewPageProps {
  params: Promise<{
    owner: string;
    repo: string;
    pr: string;
  }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/");
  }

  const { owner, repo, pr } = await params;
  const prNumber = parseInt(pr);

  const prDetails = await getPRDetails(owner, repo, prNumber).catch(() => null);

  if (!prDetails) {
    // Get user's language preference
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    }).catch(() => null);
    const userLanguage = (userSettings?.language || 'en') as 'en' | 'tr';
    const { translations } = await import('@/lib/i18n');
    const t = translations[userLanguage];
    
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">{t.errorLoadingPR}</h1>
          <p className="text-gray-400">{t.couldNotLoadPR}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-12">
        <ReviewTypeSelection
          owner={owner}
          repo={repo}
          prNumber={prNumber}
          prDetails={prDetails}
        />
      </div>
    </div>
  );
}
