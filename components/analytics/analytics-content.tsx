"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { KPICard } from "./kpi-card";
import { PerformanceChart } from "./performance-chart";
import { ReviewTypeUsage } from "./review-type-usage";
import { ListChecks, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

interface AnalyticsData {
  totalReviews: number;
  reviewsChangePercent: number;
  criticalIssuesCount: number;
  criticalChangePercent: number;
  aiUsageRate: number;
  usageChangePercent: number;
  reviewTypeDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  trendsData: {
    date: string;
    count: number;
  }[];
}

export function AnalyticsContent() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly">("weekly");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const datePickerRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start && end) {
        params.set("startDate", start);
        params.set("endDate", end);
      }
      const url = `/api/analytics${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Close date picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }

    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDatePicker]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.analyticsTitle}</h1>
        <p className="text-gray-400">{t.analyticsDescription}</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab("weekly")}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            activeTab === "weekly"
              ? "bg-purple-600 text-white"
              : "bg-gray-900 text-gray-400 hover:bg-gray-800"
          }`}
        >
          {t.weekly}
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            activeTab === "monthly"
              ? "bg-purple-600 text-white"
              : "bg-gray-900 text-gray-400 hover:bg-gray-800"
          }`}
        >
          {t.monthly}
        </button>
        <div className="relative" ref={datePickerRef}>
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-6 py-2.5 rounded-lg font-medium bg-gray-900 text-gray-400 hover:bg-gray-800 transition flex items-center gap-2"
          >
            {t.selectDateRange}
            <Calendar className="w-4 h-4" />
          </button>
          
          {showDatePicker && (
            <div className="absolute top-full mt-2 right-0 bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-xl z-20 min-w-[300px]">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t.startDate}</label>
                  <input
                    type="date"
                    value={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t.endDate}</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (startDate && endDate) {
                        fetchAnalytics(startDate, endDate);
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={!startDate || !endDate}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.apply}
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title={t.totalReviews}
          value={data.totalReviews.toLocaleString()}
          change={data.reviewsChangePercent}
          changeLabel={t.thisWeek}
          icon={ListChecks}
          iconColor="text-purple-500"
        />
        <KPICard
          title={t.criticalIssuesFound}
          value={data.criticalIssuesCount}
          change={data.criticalChangePercent}
          changeLabel={t.thisWeek}
          icon={AlertTriangle}
          iconColor="text-red-500"
        />
        <KPICard
          title={t.aiUsageRate}
          value={`${data.aiUsageRate}%`}
          change={data.usageChangePercent}
          changeLabel={t.thisWeek}
          icon={TrendingUp}
          iconColor="text-blue-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart
            data={data.trendsData}
            title={t.performanceTrends}
            subtitle={t.aiEfficiencyOverTime}
            language={language}
          />
        </div>
        <div>
          <ReviewTypeUsage
            data={data.reviewTypeDistribution}
            title={t.reviewTypeUsage}
            subtitle={t.distributionOfReviews}
          />
        </div>
      </div>
    </div>
  );
}
