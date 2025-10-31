"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Info, Trash2, History, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Review {
  id: string;
  status: string;
  reviewType: string;
  prTitle: string;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  critical?: Array<{
    file: string;
    lineRange: string;
    issue: string;
    suggestion: string;
    severity: "high" | "medium" | "low";
    labels?: string[];
  }>;
  suggestions?: Array<{
    file: string;
    lineRange: string;
    issue: string;
    suggestion: string;
    labels?: string[];
  }>;
  bestPractices?: Array<{
    file: string;
    lineRange: string;
    issue: string;
    suggestion: string;
    labels?: string[];
  }>;
  completedAt?: Date | null;
  createdAt: Date;
  commentAdded?: boolean;
}

interface ReviewResultsProps {
  review: Review;
  owner: string;
  repo: string;
  prNumber: number;
  previousReviews?: Array<{
    id: string;
    reviewType: string;
    createdAt: Date;
    commentAdded: boolean;
    critical: unknown;
    suggestions: unknown;
    bestPractices: unknown;
  }>;
  userLanguage?: string;
  headBranch?: string;
  baseBranch?: string;
  prAuthor?: string;
  prAuthorAvatar?: string;
}

const translations = {
  en: {
    reviewHistory: "Review History",
    newReview: "New Review",
    reviewingChanges: "Reviewing changes from",
    to: "to",
    submitToGitHub: "Submit to GitHub",
    submitting: "Submitting...",
    total: "Total",
    issues: "issues",
    criticalIssues: "Critical Issues",
    suggestions: "Suggestions",
    bestPractices: "Best Practices",
    noCriticalIssues: "No critical issues found",
    noSuggestions: "No suggestions found",
    noBestPractices: "No best practices suggestions found",
    delete: "Delete",
    dashboard: "Dashboard",
    previousReviews: "Previous Reviews",
    openedBy: "opened by",
    noReviewsYet: "No reviews for this PR yet.",
    current: "Current",
    submittedToGitHub: "Submitted to GitHub",
    reviewType: "Review Type",
  },
  tr: {
    reviewHistory: "İnceleme Geçmişi",
    newReview: "Yeni İnceleme",
    reviewingChanges: "Değişiklikler inceleniyor:",
    to: "→",
    submitToGitHub: "GitHub'a Gönder",
    submitting: "Gönderiliyor...",
    total: "Toplam",
    issues: "sorun",
    criticalIssues: "Kritik Sorunlar",
    suggestions: "Öneriler",
    bestPractices: "En İyi Uygulamalar",
    noCriticalIssues: "Kritik sorun bulunamadı",
    noSuggestions: "Öneri bulunamadı",
    noBestPractices: "En iyi uygulama önerisi bulunamadı",
    delete: "Sil",
    dashboard: "Dashboard",
    previousReviews: "Önceki İncelemeler",
    openedBy: "açan:",
    noReviewsYet: "Bu PR için henüz başka review yapılmamış.",
    current: "Şu Anki",
    submittedToGitHub: "GitHub'a Gönderildi",
    reviewType: "Review Tipi",
  },
};

export function ReviewResults({ 
  review: initialReview, 
  owner, 
  repo, 
  prNumber, 
  previousReviews = [],
  userLanguage = 'en',
  headBranch = 'feature-branch',
  baseBranch = 'main',
  prAuthor = 'coder_user',
  prAuthorAvatar,
}: ReviewResultsProps) {
  const t = translations[userLanguage as keyof typeof translations] || translations.en;
  const [review, setReview] = useState(initialReview);
  const [activeSection, setActiveSection] = useState<"critical" | "suggestions" | "bestPractices">("critical");
  const [codeSnippets, setCodeSnippets] = useState<Record<string, { code: string; startLine: number; endLine: number; lineRange: string }>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reviewHistory, setReviewHistory] = useState<Review[]>([]);
  const router = useRouter();

  const fetchCodeSnippet = async (file: string, lineRange: string) => {
    const key = `${file}:${lineRange}`;
    if (codeSnippets[key]) return;

    try {
      // Parse lineRange to get first line number
      const firstLine = parseInt(lineRange.split('-')[0]);
      
      const response = await fetch("/api/github/code-snippet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, path: file, line: firstLine }),
      });
      const snippet = await response.json();
      setCodeSnippets(prev => ({ ...prev, [key]: { ...snippet, lineRange } }));
    } catch (error) {
      console.error("Error fetching code snippet:", error);
    }
  };

  const toggleExpand = (file: string, lineRange: string) => {
    const key = `${file}:${lineRange}`;
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      fetchCodeSnippet(file, lineRange);
    }
    setExpandedItems(newExpanded);
  };


  const handleDelete = async (type: string, index: number) => {
    if (!confirm("Bu öğeyi silmek istediğinizden emin misiniz?")) return;

    try {
      const response = await fetch(`/api/review/${review.id}/delete-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, index }),
      });

      if (response.ok) {
        // Update local state - refetch from API to get fresh data
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting issue:", error);
      alert("Silme işlemi başarısız oldu.");
    }
  };

  const handleSubmit = async () => {
    const totalIssues = (review.critical?.length || 0) + (review.suggestions?.length || 0) + (review.bestPractices?.length || 0);
    
    if (totalIssues === 0) {
      alert("GitHub'a gönderilecek hiçbir issue yok.");
      return;
    }

    if (!confirm(`${totalIssues} issue GitHub'a PR yorumu olarak gönderilecek. Onaylıyor musunuz?`)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/review/${review.id}/submit`, {
        method: "POST",
      });

      if (response.ok) {
        setShowSuccessDialog(true);
      } else {
        throw new Error("Submit failed");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("GitHub'a gönderme işlemi başarısız oldu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const critical = review.critical || [];
  const suggestions = review.suggestions || [];
  const bestPractices = review.bestPractices || [];

  const fetchReviewHistory = async () => {
    try {
      const response = await fetch(`/api/review/history?owner=${owner}&repo=${repo}&prNumber=${prNumber}`);
      const data = await response.json();
      setReviewHistory(data);
      setShowHistory(true);
    } catch (error) {
      console.error("Error fetching review history:", error);
    }
  };

  useEffect(() => {
    if (review.status !== "PROCESSING") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/review/${review.id}`);
        const data = await response.json();
        
        setReview(data);
        
        if (data.status !== "PROCESSING") {
          router.refresh();
        }
      } catch (error) {
        console.error("Error polling review status:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [review.id, review.status, router]);

  // Auto-expand first 3 items when section changes
  useEffect(() => {
    if (review.status !== "COMPLETED") return;
    
    const items = activeSection === "critical" ? critical : activeSection === "suggestions" ? suggestions : bestPractices;
    const toExpand = items.slice(0, 3).map(item => `${item.file}:${item.lineRange}`);
    const newExpanded = new Set(toExpand);
    
    toExpand.forEach(key => {
      if (!codeSnippets[key]) {
        const [file, lineRange] = key.split(':');
        fetchCodeSnippet(file, lineRange);
      }
    });
    
    setExpandedItems(newExpanded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, owner, repo, review.status]);

  if (review.status === "PROCESSING") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#1a2332] to-[#0a0f1e] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500/30 rounded-full animate-float"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-purple-300/30 rounded-full animate-float"></div>
          <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-blue-300/40 rounded-full animate-float-delayed"></div>
        </div>

        <div className="max-w-4xl w-full flex flex-col items-center gap-16">
          {/* Enhanced animated spinner with constrained size */}
          <div className="relative inline-flex items-center justify-center w-64 h-64 flex-shrink-0">
            {/* Outer orbiting particles - positioned outside main circle */}
            <div className="absolute inset-0 w-64 h-64">
              <div className="absolute top-0 left-1/2 w-2.5 h-2.5 -ml-1.25 bg-purple-500 rounded-full blur-sm animate-orbit"></div>
              <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 bg-blue-400 rounded-full blur-sm animate-orbit-reverse"></div>
            </div>

            {/* Outer rotating ring with gradient */}
            <div className="absolute inset-4 rounded-full border-[3px] border-purple-500/10"></div>
            <div className="absolute inset-4 rounded-full border-[3px] border-transparent border-t-purple-500 border-r-purple-400/60 animate-spin" style={{ animationDuration: '3s' }}></div>
            
            {/* Middle rotating ring - opposite direction with glow */}
            <div className="absolute inset-8 rounded-full border-[3px] border-blue-500/10 shadow-lg shadow-blue-500/5"></div>
            <div className="absolute inset-8 rounded-full border-[3px] border-transparent border-b-blue-400 border-l-cyan-400/60 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}></div>
            
            {/* Inner pulsing ring */}
            <div className="absolute inset-12 rounded-full border-[2px] border-purple-400/20 animate-pulse-ring"></div>
            
            {/* Inner gradient circle with stronger pulse */}
            <div className="absolute inset-16 rounded-full bg-gradient-to-br from-purple-600/40 via-blue-600/30 to-purple-600/40 animate-pulse-slow"></div>
            
            {/* Center icon container with glow */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse"></div>
                
                {/* AI Icon */}
                <svg className="relative w-16 h-16 text-purple-400 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                
                {/* Enhanced sparkles */}
                <div className="absolute -top-2 -right-2 w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping"></div>
                <div className="absolute -top-2 -right-2 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"></div>
                
                <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-blue-400 rounded-full animate-ping animation-delay-300"></div>
                <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-300"></div>
                
                <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping animation-delay-600"></div>
                <div className="absolute -top-1 left-1/2 w-1.5 h-1.5 bg-purple-300 rounded-full animate-ping animation-delay-900"></div>
              </div>
            </div>
          </div>

          {/* Text content - clearly separated from spinner */}
          <div className="space-y-5 text-center px-6 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {userLanguage === 'tr' ? 'AI İncelemesi Sürüyor' : 'AI Review in Progress'}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed">
              {userLanguage === 'tr' 
                ? 'AI, kodunuzu analiz ediyor. Bu işlem birkaç dakika sürebilir. Lütfen bekleyiniz...' 
                : 'AI is analyzing your code. This may take a few minutes. Please wait...'}
            </p>
          </div>

          {/* Status indicator with enhanced animation */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0s', animationDuration: '1s' }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '1s' }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '1s' }}></div>
            </div>
            <span className="text-sm text-gray-300 font-medium">
              {userLanguage === 'tr' ? 'GitHub ile senkronize ediliyor...' : 'Syncing with GitHub...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (review.status === "FAILED") {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <h1 className="text-4xl font-bold">İnceleme Başarısız</h1>
          <p className="text-xl text-gray-400">
            PR #{prNumber}: {review.prTitle}
          </p>
          <p className="text-gray-500">
            İnceleme sırasında bir hata oluştu. Lütfen tekrar deneyin.
          </p>
          <Button onClick={() => router.push(`/review/${owner}/${repo}/${prNumber}`)}>
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 bg-[#111111] flex flex-col h-screen">
        <div className="p-4 flex-shrink-0">
          <div className="space-y-4 mb-6">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">{t.dashboard}</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="font-bold text-white">AI Code Review</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50">
              {prAuthorAvatar ? (
                <img 
                  src={prAuthorAvatar} 
                  alt={prAuthor}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                  {prAuthor.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{review.prTitle}</div>
                <div className="text-xs text-gray-500">#{prNumber} {t.openedBy} {prAuthor}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 flex-shrink-0 border-t border-gray-800">
          <div className="space-y-1">
          <button
            onClick={() => setActiveSection("critical")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "critical" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{t.criticalIssues}</span>
            </div>
            {critical.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                {critical.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection("suggestions")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "suggestions" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>{t.suggestions}</span>
            </div>
            {suggestions.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                {suggestions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection("bestPractices")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "bestPractices" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.bestPractices}</span>
            </div>
            {bestPractices.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                {bestPractices.length}
              </span>
            )}
          </button>
          </div>
        </div>

        {/* Previous Reviews */}
        {previousReviews.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-800 flex-1 overflow-y-auto min-h-0">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t.previousReviews} ({previousReviews.length})
            </h3>
            <div className="space-y-1">
              {previousReviews.map((prevReview) => {
                const criticalCount = Array.isArray(prevReview.critical) ? prevReview.critical.length : JSON.parse((prevReview.critical as string) || '[]').length;
                const suggestionsCount = Array.isArray(prevReview.suggestions) ? prevReview.suggestions.length : JSON.parse((prevReview.suggestions as string) || '[]').length;
                const bestPracticesCount = Array.isArray(prevReview.bestPractices) ? prevReview.bestPractices.length : JSON.parse((prevReview.bestPractices as string) || '[]').length;
                
                return (
                  <a
                    key={prevReview.id}
                    href={`/review/${owner}/${repo}/${prNumber}/results?reviewId=${prevReview.id}`}
                    className="block px-3 py-2 rounded-lg bg-gray-800/30 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Clock className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-400 flex-1">
                        {new Date(prevReview.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {prevReview.commentAdded && (
                        <span className="text-xs text-green-400">✓</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-gray-400">{criticalCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <span className="text-gray-400">{suggestionsCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-gray-400">{bestPracticesCount}</span>
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8 space-y-6">
          {/* Header */}
          <div className="space-y-4 pb-6 border-b border-gray-800">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-white break-words">
                  AI Review for &apos;{review.prTitle}&apos;
                </h1>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  onClick={fetchReviewHistory}
                  variant="outline"
                  className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <History className="w-4 h-4 mr-2" />
                  {t.reviewHistory}
                </Button>
                <Button 
                  onClick={() => router.push("/dashboard")}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {t.newReview}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
              <span>{t.reviewingChanges}</span>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">{headBranch}</code>
              <span>{t.to}</span>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">{baseBranch}</code>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || (critical.length + suggestions.length + bestPractices.length) === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t.submitting : t.submitToGitHub}
              </Button>
              <div className="text-sm text-gray-400">
                {t.total}: <span className="text-purple-400 font-medium">{critical.length + suggestions.length + bestPractices.length} {t.issues}</span>
              </div>
            </div>
          </div>

          {/* Critical Issues */}
          {activeSection === "critical" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  {t.criticalIssues} ({critical.length})
                </h2>
              </div>
              {critical.length > 0 ? (
                <div className="space-y-4">
                  {critical.map((item, idx) => {
                    const key = `${item.file}:${item.lineRange}`;
                    const isExpanded = expandedItems.has(key);
                    const snippet = codeSnippets[key];
                    
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-800 bg-[#1a1a1a] overflow-hidden hover:border-gray-700 transition-all"
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <button
                                onClick={() => toggleExpand(item.file, item.lineRange)}
                                className="font-mono text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {item.file}
                                <span className="text-gray-500">:{item.lineRange}</span>
                              </button>
                              
                              <div className="space-y-2">
                                <p className="text-base text-white leading-relaxed">{item.issue}</p>
                                {item.suggestion && (
                                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <p className="text-sm text-gray-300 leading-relaxed">{item.suggestion}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {isExpanded && snippet && snippet.code && (
                                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-900">
                                  <pre className="text-sm font-mono overflow-x-auto">
                                    {snippet.code.split("\n").map((line: string, i: number) => {
                                      const lineNum = snippet.startLine + i;
                                      // Parse lineRange to check if current line is in range
                                      const rangeStr = snippet.lineRange || '';
                                      const rangeParts = rangeStr.split('-').filter(p => p);
                                      const rangeStart = parseInt(rangeParts[0] || '0');
                                      const rangeEnd = rangeParts.length > 1 ? parseInt(rangeParts[1] || '0') : null;
                                      const isInRange = rangeEnd ? (lineNum >= rangeStart && lineNum <= rangeEnd) : lineNum === rangeStart;
                                      
                                      return (
                                        <div key={i} className={`py-0.5 ${isInRange ? "bg-red-900/20" : ""}`}>
                                          <span className="inline-block w-12 text-gray-600 select-none text-right mr-4">{lineNum}</span>
                                          <span className={isInRange ? "text-red-400" : "text-gray-400"}>{line}</span>
                                        </div>
                                      );
                                    })}
                                  </pre>
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => handleDelete("critical", idx)}
                              className="p-2 hover:bg-red-500/10 rounded transition-colors group"
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                            </button>
                          </div>
                          {item.labels && item.labels.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-3">
                              {item.labels.map((label, labelIdx) => (
                                <span 
                                  key={labelIdx} 
                                  className="px-2.5 py-1 rounded-md text-xs bg-red-900/40 text-red-400 font-medium border border-red-800/30"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t.noCriticalIssues}</p>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {activeSection === "suggestions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <Info className="w-6 h-6 text-yellow-500" />
                  {t.suggestions} ({suggestions.length})
                </h2>
              </div>
              {suggestions.length > 0 ? (
                <div className="space-y-4">
                  {suggestions.map((item, idx) => {
                    const key = `${item.file}:${item.lineRange}`;
                    const isExpanded = expandedItems.has(key);
                    const snippet = codeSnippets[key];
                    
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-800 bg-[#1a1a1a] overflow-hidden hover:border-gray-700 transition-all"
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <button
                                onClick={() => toggleExpand(item.file, item.lineRange)}
                                className="font-mono text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {item.file}
                                <span className="text-gray-500">:{item.lineRange}</span>
                              </button>
                              
                              <div className="space-y-2">
                                <p className="text-base text-white leading-relaxed">{item.issue}</p>
                                {item.suggestion && (
                                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <p className="text-sm text-gray-300 leading-relaxed">{item.suggestion}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {isExpanded && snippet && snippet.code && (
                                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-900">
                                  <pre className="text-sm font-mono overflow-x-auto">
                                    {snippet.code.split("\n").map((line: string, i: number) => {
                                      const lineNum = snippet.startLine + i;
                                      const rangeStr = snippet.lineRange || '';
                                      const rangeParts = rangeStr.split('-').filter(p => p);
                                      const rangeStart = parseInt(rangeParts[0] || '0');
                                      const rangeEnd = rangeParts.length > 1 ? parseInt(rangeParts[1] || '0') : null;
                                      const isInRange = rangeEnd ? (lineNum >= rangeStart && lineNum <= rangeEnd) : lineNum === rangeStart;
                                      
                                      return (
                                        <div key={i} className={`py-0.5 ${isInRange ? "bg-yellow-900/20" : ""}`}>
                                          <span className="inline-block w-12 text-gray-600 select-none text-right mr-4">{lineNum}</span>
                                          <span className={isInRange ? "text-yellow-400" : "text-gray-400"}>{line}</span>
                                        </div>
                                      );
                                    })}
                                  </pre>
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => handleDelete("suggestions", idx)}
                              className="p-2 hover:bg-yellow-500/10 rounded transition-colors group"
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-yellow-400" />
                            </button>
                          </div>
                          {item.labels && item.labels.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-3">
                              {item.labels.map((label, labelIdx) => (
                                <span 
                                  key={labelIdx} 
                                  className="px-2.5 py-1 rounded-md text-xs bg-yellow-900/40 text-yellow-400 font-medium border border-yellow-800/30"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t.noSuggestions}</p>
                </div>
              )}
            </div>
          )}

          {/* Best Practices */}
          {activeSection === "bestPractices" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  {t.bestPractices} ({bestPractices.length})
                </h2>
              </div>
              {bestPractices.length > 0 ? (
                <div className="space-y-4">
                  {bestPractices.map((item, idx) => {
                    const key = `${item.file}:${item.lineRange}`;
                    const isExpanded = expandedItems.has(key);
                    const snippet = codeSnippets[key];
                    
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-800 bg-[#1a1a1a] overflow-hidden hover:border-gray-700 transition-all"
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <button
                                onClick={() => toggleExpand(item.file, item.lineRange)}
                                className="font-mono text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {item.file}
                                <span className="text-gray-500">:{item.lineRange}</span>
                              </button>
                              
                              <div className="space-y-2">
                                <p className="text-base text-white leading-relaxed">{item.issue}</p>
                                {item.suggestion && (
                                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <p className="text-sm text-gray-300 leading-relaxed">{item.suggestion}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {isExpanded && snippet && snippet.code && (
                                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-900">
                                  <pre className="text-sm font-mono overflow-x-auto">
                                    {snippet.code.split("\n").map((line: string, i: number) => {
                                      const lineNum = snippet.startLine + i;
                                      const rangeStr = snippet.lineRange || '';
                                      const rangeParts = rangeStr.split('-').filter(p => p);
                                      const rangeStart = parseInt(rangeParts[0] || '0');
                                      const rangeEnd = rangeParts.length > 1 ? parseInt(rangeParts[1] || '0') : null;
                                      const isInRange = rangeEnd ? (lineNum >= rangeStart && lineNum <= rangeEnd) : lineNum === rangeStart;
                                      
                                      return (
                                        <div key={i} className={`py-0.5 ${isInRange ? "bg-green-900/20" : ""}`}>
                                          <span className="inline-block w-12 text-gray-600 select-none text-right mr-4">{lineNum}</span>
                                          <span className={isInRange ? "text-green-400" : "text-gray-400"}>{line}</span>
                                        </div>
                                      );
                                    })}
                                  </pre>
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => handleDelete("bestPractices", idx)}
                              className="p-2 hover:bg-green-500/10 rounded transition-colors group"
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-green-400" />
                            </button>
                          </div>
                          {item.labels && item.labels.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-3">
                              {item.labels.map((label, labelIdx) => (
                                <span 
                                  key={labelIdx} 
                                  className="px-2.5 py-1 rounded-md text-xs bg-green-900/40 text-green-400 font-medium border border-green-800/30"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t.noBestPractices}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review History Dialog */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <History className="w-6 h-6" />
                {t.reviewHistory}
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded transition-colors"
              >
                ✕
              </button>
            </div>
            
            {reviewHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t.noReviewsYet}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewHistory.map((rev) => {
                  const isCurrent = rev.id === review.id;
                  return (
                    <div
                      key={rev.id}
                      className={`rounded-lg border p-4 transition-all ${
                        isCurrent
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-gray-800 bg-[#0a0a0a] hover:border-gray-700 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (!isCurrent) {
                          router.push(`/review/${owner}/${repo}/${prNumber}/results?reviewId=${rev.id}`);
                          setShowHistory(false);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {new Date(rev.createdAt).toLocaleString('tr-TR')}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 font-medium">
                                {t.current}
                              </span>
                            )}
                            {rev.commentAdded && (
                              <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 font-medium">
                                ✓ {t.submittedToGitHub}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span className="text-gray-300">{(rev.critical || []).length} {t.criticalIssues}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Info className="w-4 h-4 text-yellow-400" />
                              <span className="text-gray-300">{(rev.suggestions || []).length} {t.suggestions}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-gray-300">{(rev.bestPractices || []).length} {t.bestPractices}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {t.reviewType}: <span className="text-gray-400">{rev.reviewType}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  Review Başarıyla Gönderildi!
                </h3>
                <p className="text-gray-400">
                  AI review yorumları GitHub PR&apos;ine eklendi.
                  <br />
                  <span className="text-purple-400 font-medium">#{prNumber} {review.prTitle}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  window.open(`https://github.com/${owner}/${repo}/pull/${prNumber}`, "_blank");
                }}
                variant="outline"
                className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                GitHub&apos;da Gör
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessDialog(false);
                  router.push("/dashboard");
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Dashboard&apos;a Dön
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
