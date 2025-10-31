"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { 
  History, 
  GitPullRequest, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface Review {
  id: string;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  reviewType: string;
  status: string;
  critical: unknown;
  suggestions: unknown;
  bestPractices: unknown;
  commentAdded: boolean;
  labelAdded: boolean;
  createdAt: Date;
  completedAt: Date | null;
}

interface ReviewHistoryProps {
  reviews: Review[];
}

export function ReviewHistory({ reviews }: ReviewHistoryProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "not-submitted">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "BACKEND" | "FRONTEND" | "MOBILE">("all");

  const filteredReviews = reviews.filter((review) => {
    if (statusFilter === "submitted" && !review.commentAdded) return false;
    if (statusFilter === "not-submitted" && review.commentAdded) return false;
    if (typeFilter !== "all" && review.reviewType !== typeFilter) return false;
    return true;
  });

  const groupedByRepo = filteredReviews.reduce((acc, review) => {
    const repoKey = `${review.owner}/${review.repo}`;
    if (!acc[repoKey]) {
      acc[repoKey] = [];
    }
    acc[repoKey].push(review);
    return acc;
  }, {} as Record<string, Review[]>);

  const getIssueCount = (data: unknown) => {
    try {
      if (Array.isArray(data)) return data.length;
      if (typeof data === 'string') return JSON.parse(data).length;
      return 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.reviewHistoryTitle}</h1>
                <p className="text-sm text-gray-400">
                  {t.allAIReviews} - {reviews.length} {t.totalReviewsCount}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">{t.filterBy}</span>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              {[
                { key: "all", label: t.all },
                { key: "submitted", label: t.submitted },
                { key: "not-submitted", label: t.notSubmitted },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key as "all" | "submitted" | "not-submitted")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition",
                    statusFilter === key
                      ? "bg-purple-600 text-white"
                      : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              {[
                { key: "all", label: t.allTypes },
                { key: "BACKEND", label: t.backend },
                { key: "FRONTEND", label: t.frontend },
                { key: "MOBILE", label: t.mobile },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key as "all" | "BACKEND" | "FRONTEND" | "MOBILE")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition",
                    typeFilter === key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="ml-auto text-sm text-gray-400">
              {filteredReviews.length} {t.results}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {Object.keys(groupedByRepo).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center mb-4">
              <History className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">{t.noReviewsYet}</h3>
            <p className="text-gray-500">{t.noReviewsMatchingFilters}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByRepo).map(([repoKey, repoReviews]) => (
              <div key={repoKey} className="space-y-4">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold">{repoKey}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">
                    {repoReviews.length} {t.review}
                  </span>
                </div>

                <div className="grid gap-4">
                  {repoReviews.map((review) => {
                    const criticalCount = getIssueCount(review.critical);
                    const suggestionsCount = getIssueCount(review.suggestions);
                    const bestPracticesCount = getIssueCount(review.bestPractices);
                    const totalIssues = criticalCount + suggestionsCount + bestPracticesCount;

                    return (
                      <Link
                        key={review.id}
                        href={`/review/${review.owner}/${review.repo}/${review.prNumber}/results?reviewId=${review.id}`}
                        className="block rounded-xl border border-gray-800 bg-[#0a0a0a] hover:border-gray-700 transition p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-medium text-white hover:text-purple-400 transition">
                                  {review.prTitle}
                                </h3>
                                <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <GitPullRequest className="w-3.5 h-3.5" />
                                    PR #{review.prNumber}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDistanceToNow(new Date(review.createdAt), { 
                                      addSuffix: true,
                                      locale: dateLocale 
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span className="px-2 py-0.5 rounded text-xs bg-blue-900/30 text-blue-400 border border-blue-800">
                                    {review.reviewType}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Issue Stats */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-gray-300">
                                  <span className="font-semibold text-red-400">{criticalCount}</span> {t.critical}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm text-gray-300">
                                  <span className="font-semibold text-yellow-400">{suggestionsCount}</span> {t.suggestions}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-gray-300">
                                  <span className="font-semibold text-green-400">{bestPracticesCount}</span> {t.bestPractices}
                                </span>
                              </div>
                              <div className="ml-auto text-sm font-semibold text-purple-400">
                                {totalIssues} {t.totalIssues}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex flex-col items-end gap-2">
                            {review.commentAdded ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 border border-green-800">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">{t.submittedToGitHub}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 border border-gray-700">
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">{t.notSubmitted}</span>
                              </div>
                            )}
                            {review.status === "COMPLETED" && (
                              <span className="text-xs text-gray-500">
                                {review.completedAt && formatDistanceToNow(new Date(review.completedAt), { 
                                  addSuffix: true,
                                  locale: dateLocale 
                                })} {t.completedAgo}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
