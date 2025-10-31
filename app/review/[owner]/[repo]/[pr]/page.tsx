import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPRDetails } from "@/lib/actions/github";
import { ReviewTypeSelection } from "@/components/review/review-type-selection";

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
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Error Loading PR</h1>
          <p className="text-gray-400">Could not load pull request details.</p>
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
