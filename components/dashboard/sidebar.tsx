"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Code, Settings, LogOut, Sparkles, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { User } from "next-auth";

interface Repo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private?: boolean;
  description?: string | null;
  updatedAt?: string | null;
}

interface SidebarProps {
  repos: Repo[];
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-[#1a0b2e] via-[#1a0b2e] to-[#0f0520] min-h-screen flex flex-col border-r border-purple-900/20 shadow-2xl shadow-purple-900/10">
      {/* Logo/Header Section */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-all group-hover:scale-105">
            <Code className="w-6 h-6 text-white" />
            <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg opacity-20 blur group-hover:opacity-40 transition-opacity"></div>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg flex items-center gap-1">
              PRism AI
              <Sparkles className="w-3 h-3 text-purple-400" />
            </h1>
            <p className="text-gray-400 text-xs">Smart Code Reviews</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 space-y-2 flex-1">
        <Link
          href="/analytics"
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all text-sm group relative overflow-hidden",
            pathname === "/analytics"
              ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/30"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {t.analytics}
          {pathname === "/analytics" && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-500/20 animate-pulse"></div>
          )}
        </Link>
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all text-sm group relative overflow-hidden",
            pathname === "/dashboard" || pathname?.startsWith("/dashboard")
              ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/30"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Code className="w-5 h-5 group-hover:scale-110 transition-transform" />
          PRs
          {(pathname === "/dashboard" || pathname?.startsWith("/dashboard")) && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-500/20 animate-pulse"></div>
          )}
        </Link>
        <Link
          href="/history"
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all text-sm group relative overflow-hidden",
            pathname === "/history"
              ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/30"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {t.reviewHistory}
          {pathname === "/history" && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-500/20 animate-pulse"></div>
          )}
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all text-sm group relative overflow-hidden",
            pathname === "/settings"
              ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/30"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {t.settings}
          {pathname === "/settings" && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-500/20 animate-pulse"></div>
          )}
        </Link>
      </nav>

      {/* User Profile & Logout at Bottom */}
      <div className="p-4 mt-auto border-t border-purple-900/20">
        <div className="mb-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group cursor-pointer">
          <div className="flex items-center gap-3">
            {user?.image ? (
              <div className="relative w-10 h-10 rounded-full ring-2 ring-purple-500/50 group-hover:ring-purple-500 transition-all">
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center ring-2 ring-purple-500/50 group-hover:ring-purple-500 transition-all">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate group-hover:text-purple-300 transition-colors">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">GitHub Profile</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-red-500/10 hover:text-red-400 group"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}
