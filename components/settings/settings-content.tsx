"use client";

import { useState, useEffect } from "react";
import { Settings, Globe, Key, Code, Save, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface UserSettings {
  id: string;
  language: string;
  backendPrompt: string | null;
  frontendPrompt: string | null;
  mobilePrompt: string | null;
  hasApiKey: boolean;
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
  hasSupabaseServiceKey: boolean;
}

export function SettingsContent() {
  const { language, setLanguage: setContextLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"general" | "api" | "prompts">("general");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [supabaseServiceKey, setSupabaseServiceKey] = useState("");
  const [showSupabaseAnonKey, setShowSupabaseAnonKey] = useState(false);
  const [showSupabaseServiceKey, setShowSupabaseServiceKey] = useState(false);
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
      } else if (activeTab === "api") {
        if (claudeApiKey) {
          updateData.claudeApiKey = claudeApiKey;
        }
        if (supabaseUrl) {
          updateData.supabaseUrl = supabaseUrl;
        }
        if (supabaseAnonKey) {
          updateData.supabaseAnonKey = supabaseAnonKey;
        }
        if (supabaseServiceKey) {
          updateData.supabaseServiceKey = supabaseServiceKey;
        }
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
      setClaudeApiKey(""); // Clear API key input after save
      setSupabaseUrl("");
      setSupabaseAnonKey("");
      setSupabaseServiceKey("");
      
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
            onClick={() => setActiveTab("api")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition",
              activeTab === "api"
                ? "border-purple-600 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            <Key className="w-4 h-4" />
            {t.apiKeys}
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

          {/* API Keys Tab */}
          {activeTab === "api" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">{t.claudeApiKey}</h2>
                <p className="text-sm text-gray-400 mb-4">
                  {t.claudeApiKeyDescription}{" "}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    {t.anthropicConsole}
                  </a>
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.apiKey} {settings?.hasApiKey && <span className="text-green-400">(✓ {t.configured})</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={claudeApiKey}
                        onChange={(e) => setClaudeApiKey(e.target.value)}
                        placeholder={settings?.hasApiKey ? "••••••••••••••••••••" : "sk-ant-api03-..."}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      {t.apiKeySecure}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supabase Configuration */}
              <div className="pt-6 border-t border-gray-800">
                <h2 className="text-xl font-semibold mb-2">{t.supabaseConfig || "Supabase Configuration"}</h2>
                <p className="text-sm text-gray-400 mb-4">
                  {t.supabaseConfigDescription || "Configure your own Supabase instance to use locally."}{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Supabase Dashboard
                  </a>
                </p>
                
                <div className="space-y-4">
                  {/* Supabase URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.supabaseUrl || "Supabase URL"} {settings?.hasSupabaseUrl && <span className="text-green-400">(✓ {t.configured})</span>}
                    </label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder={settings?.hasSupabaseUrl ? "https://xxxxx.supabase.co" : "https://your-project.supabase.co"}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    />
                  </div>

                  {/* Supabase Anon Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.supabaseAnonKey || "Supabase Anon Key"} {settings?.hasSupabaseAnonKey && <span className="text-green-400">(✓ {t.configured})</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showSupabaseAnonKey ? "text" : "password"}
                        value={supabaseAnonKey}
                        onChange={(e) => setSupabaseAnonKey(e.target.value)}
                        placeholder={settings?.hasSupabaseAnonKey ? "••••••••••••••••••••" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSupabaseAnonKey(!showSupabaseAnonKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
                      >
                        {showSupabaseAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Supabase Service Role Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.supabaseServiceKey || "Supabase Service Role Key"} {settings?.hasSupabaseServiceKey && <span className="text-green-400">(✓ {t.configured})</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showSupabaseServiceKey ? "text" : "password"}
                        value={supabaseServiceKey}
                        onChange={(e) => setSupabaseServiceKey(e.target.value)}
                        placeholder={settings?.hasSupabaseServiceKey ? "••••••••••••••••••••" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSupabaseServiceKey(!showSupabaseServiceKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
                      >
                        {showSupabaseServiceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      {t.serviceKeyWarning || "⚠️ Keep this key secure. It has admin access to your database."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">{t.noteForOpenSource}</h3>
                <p className="text-sm text-gray-300">
                  {t.noteDescription}
                </p>
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
