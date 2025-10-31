"use client";

import { useState, useEffect } from "react";
import { Settings, Globe, Code, Save, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface UserSettings {
  id: string;
  language: string;
  backendPrompt: string | null;
  frontendPrompt: string | null;
  mobilePrompt: string | null;
}

export function SettingsContent() {
  const { language, setLanguage: setContextLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"general" | "prompts">("general");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [backendPrompt, setBackendPrompt] = useState("");
  const [frontendPrompt, setFrontendPrompt] = useState("");
  const [mobilePrompt, setMobilePrompt] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      setSettings(data);
      setSelectedLanguage(data.language || "en");
      setBackendPrompt(data.backendPrompt || "");
      setFrontendPrompt(data.frontendPrompt || "");
      setMobilePrompt(data.mobilePrompt || "");
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setShowSuccess(false);

    try {
      const updateData: Record<string, string | null | undefined> = {};
      
      if (activeTab === "general") {
        updateData.language = selectedLanguage;
      } else if (activeTab === "prompts") {
        updateData.backendPrompt = backendPrompt;
        updateData.frontendPrompt = frontendPrompt;
        updateData.mobilePrompt = mobilePrompt;
      }

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      const data = await response.json();
      setSettings(data);
      setShowSuccess(true);
      
      // Update language context if language was changed
      if (activeTab === "general" && selectedLanguage !== language) {
        setContextLanguage(selectedLanguage as "en" | "tr");
      }
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">{t.loadingSettings}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t.settingsTitle}</h1>
              <p className="text-sm text-gray-400">{t.settingsDescription}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("general")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition",
              activeTab === "general"
                ? "border-purple-600 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            <Globe className="w-4 h-4" />
            {t.general}
          </button>
          <button
            onClick={() => setActiveTab("prompts")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition",
              activeTab === "prompts"
                ? "border-purple-600 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            <Code className="w-4 h-4" />
            {t.reviewConfiguration}
          </button>
        </div>

        {/* Success/Error Messages */}
        {showSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-green-900/20 border border-green-800 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-400">{t.savedSuccessfully}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 space-y-6">
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">{t.languagePreferences}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.interfaceLanguage}
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="en">{t.english}</option>
                      <option value="tr">{t.turkish}</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-400">
                      {t.chooseLanguage}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Configuration Tab */}
          {activeTab === "prompts" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">{t.customReviewPrompts}</h2>
                <p className="text-sm text-gray-400 mb-4">
                  {t.customPromptsDescription}
                </p>
              </div>

              <div className="space-y-6">
                {/* Backend Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.backendReviewPrompt}
                  </label>
                  <textarea
                    value={backendPrompt}
                    onChange={(e) => setBackendPrompt(e.target.value)}
                    rows={6}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none"
                    placeholder={t.enterBackendPrompt}
                  />
                </div>

                {/* Frontend Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.frontendReviewPrompt}
                  </label>
                  <textarea
                    value={frontendPrompt}
                    onChange={(e) => setFrontendPrompt(e.target.value)}
                    rows={6}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none"
                    placeholder={t.enterFrontendPrompt}
                  />
                </div>

                {/* Mobile Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.mobileReviewPrompt}
                  </label>
                  <textarea
                    value={mobilePrompt}
                    onChange={(e) => setMobilePrompt(e.target.value)}
                    rows={6}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none"
                    placeholder={t.enterMobilePrompt}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-800 flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
            >
              <Save className="w-4 h-4" />
              {saving ? t.saving : t.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
