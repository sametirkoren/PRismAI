"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useTranslations } from "@/lib/i18n";

export function TokenExpiredError() {
  const [isClearing, setIsClearing] = useState(true);
  const { language } = useLanguage();
  const t = useTranslations(language);
  
  useEffect(() => {
    // Clear the GitHub account and session immediately when component mounts
    const clearSession = async () => {
      try {
        await fetch('/api/auth/clear-github', { method: 'POST' });
      } catch (error) {
        console.error('Error clearing session:', error);
      } finally {
        setIsClearing(false);
      }
    };
    clearSession();
  }, []);
  
  const handleReconnect = async () => {
    // Sign out completely and redirect to home page to re-authenticate
    window.location.href = '/';
  };
  
  if (isClearing) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">{t.clearingSession}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t.githubTokenExpired}</h1>
          <p className="text-gray-400 text-lg">
            {t.tokenExpiredMessage}
          </p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-left">
          <p className="text-sm text-gray-300">
            This can happen when:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-400 list-disc list-inside">
            <li>You revoked access to this app in GitHub settings</li>
            <li>Your GitHub credentials have changed</li>
            <li>The app&apos;s authorization has been reset</li>
          </ul>
        </div>
        
        <Button 
          onClick={handleReconnect}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          size="lg"
        >
          Reconnect GitHub Account
        </Button>
        
        <p className="text-xs text-gray-500">
          You&apos;ll be redirected to GitHub to authorize the app again.
        </p>
      </div>
    </div>
  );
}
