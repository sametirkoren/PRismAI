"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";

interface TrendData {
  date: string;
  count: number;
}

interface PerformanceChartProps {
  data: TrendData[];
  title: string;
  subtitle: string;
  language?: "en" | "tr";
}

export function PerformanceChart({ data, title, subtitle, language = "en" }: PerformanceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; count: number; date: string } | null>(null);
  const maxValue = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);
  const dateLocale = language === "tr" ? tr : enUS;
  
  const points = useMemo(() => {
    const width = 800;
    const height = 200;
    const padding = 40;
    
    return data.map((item, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((item.count / maxValue) * (height - padding * 2));
      return { x, y, count: item.count, date: item.date };
    });
  }, [data, maxValue]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    
    const firstPoint = points[0];
    let path = `M ${firstPoint.x} ${firstPoint.y}`;
    
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const prev = points[i - 1];
      
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy2 = curr.y;
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  }, [points]);

  const areaPathD = useMemo(() => {
    if (points.length === 0) return "";
    
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    
    return `${pathD} L ${lastPoint.x} 240 L ${firstPoint.x} 240 Z`;
  }, [pathD, points]);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
      
      <div className="relative w-full h-64">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 800 240" 
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area */}
          <path
            d={areaPathD}
            fill="url(#areaGradient)"
            className="transition-all duration-300"
          />
          
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="rgb(147, 51, 234)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
          
          {/* Points */}
          {points.map((point, index) => {
            const isHovered = hoveredPoint?.date === point.date;
            return (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? "6" : "4"}
                  fill="rgb(147, 51, 234)"
                  className="transition-all duration-300"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? "12" : "8"}
                  fill="rgb(147, 51, 234)"
                  fillOpacity="0.2"
                  className="transition-all duration-300"
                />
                {/* Invisible hover area */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="20"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(point)}
                />
              </g>
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute bg-gray-800/95 backdrop-blur-sm border border-gray-700 text-white px-4 py-2.5 rounded-lg shadow-2xl text-sm pointer-events-none z-10"
            style={{
              left: `${(hoveredPoint.x / 800) * 100}%`,
              top: `${(hoveredPoint.y / 240) * 100}%`,
              transform: 'translate(-50%, calc(-100% - 12px))'
            }}
          >
            <div className="font-bold text-base text-purple-400">{hoveredPoint.count}</div>
            <div className="text-xs text-gray-300 mt-0.5">
              {format(new Date(hoveredPoint.date), 'MMM dd, yyyy', { locale: dateLocale })}
            </div>
            {/* Arrow */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-gray-800/95 border-b border-r border-gray-700 rotate-45"
            />
          </div>
        )}
      </div>
    </div>
  );
}
