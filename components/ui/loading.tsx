"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useTranslations } from "@/lib/i18n";

export function Loading() {
  const { language } = useLanguage();
  const t = useTranslations(language);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        {/* Animated gradient circles */}
        <div className="absolute inset-0 blur-3xl opacity-30">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-600 rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500 rounded-full animate-pulse delay-75"></div>
        </div>
        
        {/* Main spinner */}
        <div className="relative flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          
          <div className="text-center">
            <h3 className="text-white text-lg font-semibold mb-2">{t.loading}</h3>
            <p className="text-gray-400 text-sm">{t.preparingData}</p>
          </div>
          
          {/* Animated dots */}
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
