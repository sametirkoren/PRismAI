"use client";

interface ReviewTypeData {
  type: string;
  percentage: number;
  count: number;
}

interface ReviewTypeUsageProps {
  data: ReviewTypeData[];
  title: string;
  subtitle: string;
}

const typeColors: Record<string, { bg: string; bar: string }> = {
  BACKEND: { bg: "bg-purple-600/20", bar: "bg-purple-600" },
  FRONTEND: { bg: "bg-blue-600/20", bar: "bg-blue-600" },
  MOBILE: { bg: "bg-pink-600/20", bar: "bg-pink-600" },
};

const typeLabels: Record<string, string> = {
  BACKEND: "Backend",
  FRONTEND: "Frontend", 
  MOBILE: "Mobile",
};

export function ReviewTypeUsage({ data, title, subtitle }: ReviewTypeUsageProps) {
  // Verileri yüzdeye göre sırala
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
      
      <div className="space-y-4">
        {sortedData.map((item) => {
          const colors = typeColors[item.type] || typeColors.BACKEND;
          const label = typeLabels[item.type] || item.type;
          
          return (
            <div key={item.type}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">{label}</span>
                <span className="text-sm font-bold text-white">{item.percentage}%</span>
              </div>
              <div className={`w-full h-2 ${colors.bg} rounded-full overflow-hidden`}>
                <div
                  className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {item.count} reviews
              </div>
            </div>
          );
        })}
        
        {sortedData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No review data available
          </div>
        )}
      </div>
    </div>
  );
}
