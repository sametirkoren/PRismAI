"use client";

import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  iconColor: string;
}

export function KPICard({ title, value, change, changeLabel, icon: Icon, iconColor }: KPICardProps) {
  const isPositive = change >= 0;
  const changeColor = title.includes("Critical") || title.includes("Kritik")
    ? (change > 0 ? "text-red-400" : "text-green-400")
    : (change >= 0 ? "text-green-400" : "text-red-400");

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-purple-600/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconColor} bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-bold text-white">{value}</p>
        <div className={`text-sm font-medium ${changeColor}`}>
          {isPositive ? "+" : ""}{change}% {changeLabel}
        </div>
      </div>
    </div>
  );
}
