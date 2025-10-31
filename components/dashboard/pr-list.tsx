"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter, Calendar, List, FileText, GitPullRequest, ArrowRight, History, Clock, GitMerge } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface PR {
  id: number;
  number: number;
  title: string;
  owner: string;
  repo: string;
  author: string;
  authorAvatar: string;
  createdAt: string;
  updatedAt: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  state: string;
  status?: "needs-review" | "wip" | "ai-reviewed";
  reviewCount?: number;
  hasAIReviewLabel?: boolean;
}

interface Repo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
}

interface PRListProps {
  prs: PR[];
  repos: Repo[];
  prState?: 'open' | 'closed' | 'all';
}

export function PRList({ prs, prState = 'open' }: PRListProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "needs-review" | "wip" | "ai-reviewed">("all");
  const [selectedPRs, setSelectedPRs] = useState<number[]>([]);
  const [showHistoryFor, setShowHistoryFor] = useState<{ owner: string; repo: string; number: number } | null>(null);

  const changePRState = (newState: 'open' | 'closed' | 'all') => {
    router.push(`/dashboard?state=${newState}`);
  };

  // Auto-detect PR status based on title and state
  const prsWithStatus = prs.map((pr) => {
    if (pr.status) return pr;
    
    // Check if PR has AI Reviewed label
    if (pr.hasAIReviewLabel) {
      return { ...pr, status: "ai-reviewed" as const };
    }
    
    const title = pr.title.toLowerCase();
    if (title.includes("wip") || title.includes("draft") || title.startsWith("[wip]") || title.startsWith("draft:")) {
      return { ...pr, status: "wip" as const };
    }
    // Default to needs-review for open PRs
    return { ...pr, status: "needs-review" as const };
  });

  // Calculate counts for each filter
  const counts = {
    all: prsWithStatus.length,
    "needs-review": prsWithStatus.filter((pr) => pr.status === "needs-review").length,
    wip: prsWithStatus.filter((pr) => pr.status === "wip").length,
    "ai-reviewed": prsWithStatus.filter((pr) => pr.status === "ai-reviewed").length,
  };

  // Filter PRs based on selected filter
  const filteredPRs = filter === "all" 
    ? prsWithStatus 
    : prsWithStatus.filter((pr) => pr.status === filter);

  const groupedPRs = filteredPRs.reduce((acc, pr) => {
    const repoKey = `${pr.owner}/${pr.repo}`;
    if (!acc[repoKey]) {
      acc[repoKey] = [];
    }
    acc[repoKey].push(pr);
    return acc;
  }, {} as Record<string, PR[]>);

  const togglePR = (prId: number) => {
    // Only allow single selection
    setSelectedPRs((prev) =>
      prev.includes(prId) ? [] : [prId]
    );
  };

  // Get dynamic title based on prState
  const getTitle = () => {
    if (prState === 'closed') return t.closedPullRequests;
    if (prState === 'all') return t.allPullRequests;
    return t.openPullRequests;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{getTitle()}</h1>
        {selectedPRs.length === 1 && (
          <button
            onClick={() => {
              const selectedPR = prsWithStatus.find(pr => pr.id === selectedPRs[0]);
              if (selectedPR) {
                router.push(`/review/${selectedPR.owner}/${selectedPR.repo}/${selectedPR.number}`);
              }
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30"
          >
            <ArrowRight className="w-5 h-5" />
            {t.reviewCode}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* PR State Filter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-900">
          <button
            onClick={() => changePRState('open')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition",
              prState === 'open' ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            {t.open}
          </button>
          <button
            onClick={() => changePRState('closed')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition",
              prState === 'closed' ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            <GitMerge className="w-3.5 h-3.5" />
            {t.closed}
          </button>
          <button
            onClick={() => changePRState('all')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition",
              prState === 'all' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            {t.all}
          </button>
        </div>

        <button className="flex items-center gap-2 p-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition">
          <Filter className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 p-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition">
          <Calendar className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 p-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition">
          <List className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {[
            { key: "all", label: t.all },
            { key: "needs-review", label: t.needsReview },
            { key: "wip", label: t.wip },
            { key: "ai-reviewed", label: t.aiReviewed },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as "all" | "needs-review" | "wip" | "ai-reviewed")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2",
                filter === key
                  ? "bg-purple-600 text-white"
                  : "bg-gray-900 text-gray-400 hover:text-white"
              )}
            >
              {label}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs",
                filter === key
                  ? "bg-white/20"
                  : "bg-gray-800"
              )}>
                {counts[key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {Object.keys(groupedPRs).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center mb-4">
            <GitPullRequest className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">{t.allClear}</h3>
          <p className="text-gray-500">{t.noOpenPRs}</p>
        </div>
      ) : (
        Object.entries(groupedPRs).map(([repoKey, repoPRs]) => (
          <div key={repoKey} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-300">{repoKey}</h2>
            <div className="space-y-3">
              {repoPRs.map((pr) => {
                const isClosed = pr.state === 'closed';
                return (
                <div
                  key={pr.id}
                  onClick={() => {
                    if (isClosed) {
                      // Show history modal for closed PRs
                      setShowHistoryFor({ owner: pr.owner, repo: pr.repo, number: pr.number });
                    } else {
                      togglePR(pr.id);
                    }
                  }}
                  className={cn(
                    "group relative flex items-start gap-4 p-5 rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/30 to-gray-900/50 transition-all cursor-pointer",
                    isClosed 
                      ? "opacity-60 hover:opacity-80 hover:border-gray-700/50" 
                      : "hover:border-purple-600/30 hover:bg-gray-900/80"
                  )}
                >
                  {/* Radio Button for Single Selection - Only for Open PRs */}
                  {!isClosed && (
                    <div className="flex items-center pt-1">
                      <input
                        type="radio"
                        checked={selectedPRs.includes(pr.id)}
                        onChange={() => togglePR(pr.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 border-2 border-gray-700 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 transition-all"
                      />
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="flex-shrink-0 pt-0.5">
                    <Avatar className="w-10 h-10 border-2 border-gray-800">
                      <AvatarImage src={pr.authorAvatar} alt={pr.author} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-semibold">
                        {pr.author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {isClosed ? (
                      <div className="text-white font-semibold text-lg truncate">
                        {pr.title}
                      </div>
                    ) : (
                      <Link
                        href={`/review/${pr.owner}/${pr.repo}/${pr.number}`}
                        className="text-white hover:text-purple-400 font-semibold text-lg block truncate group-hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {pr.title}
                      </Link>
                    )}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-400">
                      <span className="font-medium">{pr.author}</span>
                      <span className="text-gray-600">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-800/50">
                        <FileText className="w-3.5 h-3.5" />
                        {pr.filesChanged}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-900/20 text-green-400">
                        +{pr.additions}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-900/20 text-red-400">
                        -{pr.deletions}
                      </span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pr.reviewCount && pr.reviewCount > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHistoryFor({ owner: pr.owner, repo: pr.repo, number: pr.number });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-900/30 text-purple-300 border border-purple-800/50 hover:bg-purple-900/50 hover:border-purple-700 transition-all"
                        title={t.viewReviewHistory}
                      >
                        <History className="w-3.5 h-3.5" />
                        {pr.reviewCount}
                      </button>
                    ) : null}
                    
                    {isClosed ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900/50 text-gray-400 border border-gray-700/50">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {t.closed}
                      </span>
                    ) : (pr.status === "wip" || pr.title.toLowerCase().includes("wip") || pr.title.toLowerCase().includes("draft")) ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-900/30 text-orange-300 border border-orange-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                        WIP
                      </span>
                    ) : (pr.status === "ai-reviewed") ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-900/30 text-green-300 border border-green-800/50">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t.aiReviewed}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-900/30 text-yellow-300 border border-yellow-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        {t.needsReview}
                      </span>
                    )}
                    
                    {!isClosed && (
                      <Link
                        href={`/review/${pr.owner}/${pr.repo}/${pr.number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all"
                      >
                        {t.reviewCode}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );})}
            </div>

            {repoPRs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-400">{t.allClear}</h3>
                <p className="text-sm text-gray-500 mt-1">{t.noOpenPRs}</p>
              </div>
            )}
          </div>
        ))
      )}

      {/* Review History Modal */}
      {showHistoryFor && (
        <ReviewHistoryModal
          owner={showHistoryFor.owner}
          repo={showHistoryFor.repo}
          prNumber={showHistoryFor.number}
          onClose={() => setShowHistoryFor(null)}
        />
      )}
    </div>
  );
}

interface ReviewHistory {
  id: string;
  reviewType: string;
  createdAt: string;
  commentAdded: boolean;
  critical: string;
  suggestions: string;
  bestPractices: string;
}

// Review History Modal Component
function ReviewHistoryModal({ owner, repo, prNumber, onClose }: { owner: string; repo: string; prNumber: number; onClose: () => void }) {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<ReviewHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const safeParseJSON = (value: string | undefined): unknown[] => {
    if (!value) return [];
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    fetch(`/api/review/history?owner=${owner}&repo=${repo}&prNumber=${prNumber}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching review history:', err);
        setLoading(false);
      });
  }, [owner, repo, prNumber]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6" />
            {t.reviewHistoryModal}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4 text-sm text-gray-400">
          <span className="font-medium text-white">{owner}/{repo}</span> • PR #{prNumber}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>{t.loadingReviews}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.noReviewsFound}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <a
                key={review.id}
                href={`/review/${owner}/${repo}/${prNumber}/results?reviewId=${review.id}`}
                className="block rounded-lg border border-gray-800 bg-[#0a0a0a] hover:border-gray-700 transition p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">
                        {new Date(review.createdAt).toLocaleString('tr-TR')}
                      </span>
                      {review.commentAdded && (
                        <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 font-medium">
                          ✓ {t.submittedToGitHub}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-gray-300">{safeParseJSON(review.critical).length} {t.critical}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="text-gray-300">{safeParseJSON(review.suggestions).length} {t.suggestions}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-gray-300">{safeParseJSON(review.bestPractices).length} {t.bestPractices}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t.reviewType}: <span className="text-gray-400">{review.reviewType}</span>
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
