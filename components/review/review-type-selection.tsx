"use client";

import { useState } from "react";
import { Database, Monitor, Smartphone, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useTranslations } from "@/lib/i18n";

interface PRDetails {
  title: string;
  body?: string | null;
  author: string;
  authorAvatar?: string;
  headRef?: string;
  baseRef?: string;
  [key: string]: unknown;
}

interface ReviewTypeSelectionProps {
  owner: string;
  repo: string;
  prNumber: number;
  prDetails: PRDetails;
}

type ReviewType = "BACKEND" | "FRONTEND" | "MOBILE";

export function ReviewTypeSelection({
  owner,
  repo,
  prNumber,
  prDetails,
}: ReviewTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<ReviewType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();
  const t = useTranslations(language);

  const reviewTypes = [
    {
      type: "BACKEND" as ReviewType,
      icon: Database,
      title: t.backendReview,
      description: t.backendReviewDesc,
      color: "from-blue-600 to-cyan-600",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-600",
    },
    {
      type: "FRONTEND" as ReviewType,
      icon: Monitor,
      title: t.frontendReview,
      description: t.frontendReviewDesc,
      color: "from-purple-600 to-pink-600",
      bgColor: "bg-purple-900/20",
      borderColor: "border-purple-600",
    },
    {
      type: "MOBILE" as ReviewType,
      icon: Smartphone,
      title: t.mobileReview,
      description: t.mobileReviewDesc,
      color: "from-green-600 to-emerald-600",
      bgColor: "bg-green-900/20",
      borderColor: "border-green-600",
    },
  ];

  const handleStartReview = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/review/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          prNumber,
          reviewType: selectedType,
        }),
      });

      const data = await response.json();
      
      if (data.reviewId) {
        router.push(`/review/${owner}/${repo}/${prNumber}/results?reviewId=${data.reviewId}`);
      }
    } catch (error) {
      console.error("Error starting review:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const headRef = prDetails.headRef || "feature-branch";
  const baseRef = prDetails.baseRef || "main";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold">
          {t.selectReviewType}
        </h1>
        <div className="space-y-3">
          <p className="text-xl text-gray-300">
            PR #{prNumber}: {prDetails.title}
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="flex items-center gap-2">
              {prDetails.authorAvatar && (
                <img
                  src={prDetails.authorAvatar}
                  alt={prDetails.author}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span className="text-sm">
                {t.createdBy} <span className="text-white font-medium">{prDetails.author}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <GitBranch className="w-4 h-4 text-purple-400" />
            <span className="text-gray-500">{t.reviewingChangesFrom}</span>
            <code className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-mono text-xs">
              {headRef}
            </code>
            <span className="text-gray-600">→</span>
            <code className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20 font-mono text-xs">
              {baseRef}
            </code>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviewTypes.map(({ type, icon: Icon, title, description, bgColor, borderColor }) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left",
              selectedType === type
                ? `${borderColor} ${bgColor} scale-105 shadow-xl`
                : "border-gray-800 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50"
            )}
          >
            {selectedType === type && (
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
                selectedType === type ? bgColor : "bg-gray-800"
              )}
            >
              <Icon className={cn("w-8 h-8", selectedType === type ? "text-white" : "text-gray-400")} />
            </div>

            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 pt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          className="px-8 bg-transparent border-gray-700 text-white hover:bg-gray-900"
        >
          {t.cancel}
        </Button>
        <Button
          size="lg"
          onClick={handleStartReview}
          disabled={!selectedType || isLoading}
          className="px-8 text-lg"
        >
          {isLoading ? t.startingReview : t.startReview}
        </Button>
      </div>
    </div>
  );
}
