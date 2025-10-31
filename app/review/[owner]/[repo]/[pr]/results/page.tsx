import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReviewResults } from "@/components/review/review-results";
import { getPRDetails } from "@/lib/actions/github";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
    pr: string;
  }>;
  searchParams: Promise<{
    reviewId?: string;
  }>;
}

export default async function ResultsPage({ params, searchParams }: PageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const { owner, repo, pr } = await params;
  const { reviewId } = await searchParams;
  
  if (!reviewId) {
    redirect(`/review/${owner}/${repo}/${pr}`);
  }

  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
      userId: session.user.id,
    },
  });

  if (!review) {
    redirect(`/review/${owner}/${repo}/${pr}`);
  }

  // Get user's language preference
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });
  const userLanguage = userSettings?.language || 'en';

  // Get PR details from GitHub to get real branch names and author info
  let headBranch = 'feature';
  const baseBranch = 'main';
  let prAuthor = owner;
  let prAuthorAvatar = undefined;
  
  try {
    const prDetails = await getPRDetails(owner, repo, parseInt(pr));
    // Extract branch name from PR title if it follows pattern "feat(BRANCH): title"
    const titleMatch = review.prTitle.match(/^\w+\(([^)]+)\):/);
    if (titleMatch) {
      headBranch = titleMatch[1];
    }
    // Get author info from PR details
    if (prDetails) {
      prAuthor = prDetails.author || owner;
      prAuthorAvatar = prDetails.authorAvatar;
    }
  } catch (error) {
    console.error("Error fetching PR details:", error);
  }

  // Get all reviews for this PR (excluding the current one)
  const previousReviews = await prisma.review.findMany({
    where: {
      userId: session.user.id,
      owner,
      repo,
      prNumber: parseInt(pr),
      NOT: {
        id: reviewId,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const processedCriticalIssues = (() => {
    let parsedCritical: unknown = review.critical;
    if (typeof review.critical === 'string') {
      try {
        parsedCritical = JSON.parse(review.critical);
      } catch (e) {
        console.error("Failed to parse review.critical as JSON:", e);
        return undefined;
      }
    }
    if (Array.isArray(parsedCritical)) {
      return parsedCritical as { file: string; lineRange: string; issue: string; suggestion: string; severity: "medium" | "high" | "low"; }[];
    }
    return undefined;
  })();

  const processedSuggestions = (() => {
    let parsedSuggestions: unknown = review.suggestions;
    if (typeof review.suggestions === 'string') {
      try {
        parsedSuggestions = JSON.parse(review.suggestions);
      } catch (e) {
        console.error("Failed to parse review.suggestions as JSON:", e);
        return undefined;
      }
    }
    if (Array.isArray(parsedSuggestions)) {
      return parsedSuggestions as { file: string; lineRange: string; issue: string; suggestion: string; }[];
    }
    return undefined;
  })();

  const processedBestPractices = (() => {
    let parsedBestPractices: unknown = review.bestPractices;
    if (typeof review.bestPractices === 'string') {
      try {
        parsedBestPractices = JSON.parse(review.bestPractices);
      } catch (e) {
        console.error("Failed to parse review.bestPractices as JSON:", e);
        return undefined;
      }
    }
    if (Array.isArray(parsedBestPractices)) {
      return parsedBestPractices as { file: string; lineRange: string; issue: string; suggestion: string; }[];
    }
    return undefined;
  })();

  return (
    <ReviewResults 
      review={{ 
        ...review, 
        filesChanged: review.filesChanged ?? 0, 
        linesAdded: review.linesAdded ?? 0, 
        linesRemoved: review.linesRemoved ?? 0, 
        critical: processedCriticalIssues, 
        suggestions: processedSuggestions, 
        bestPractices: processedBestPractices 
      }} 
      owner={owner} 
      repo={repo} 
      prNumber={parseInt(pr)}
      previousReviews={previousReviews}
      userLanguage={userLanguage}
      headBranch={headBranch}
      baseBranch={baseBranch}
      prAuthor={prAuthor}
      prAuthorAvatar={prAuthorAvatar}
    />
  );
}
