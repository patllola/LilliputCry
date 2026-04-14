import { FeedingLog } from "@/types/feeding";
import { formatMl, timeAgo, wastePercent } from "@/lib/utils";
import { isToday } from "date-fns";

interface StatsBarProps {
  logs: FeedingLog[];
}

export default function StatsBar({ logs }: StatsBarProps) {
  const todayLogs = logs.filter((l) => isToday(new Date(l.fedAt)));
  const totalFedToday = todayLogs.reduce((s, l) => s + l.milkFed, 0);
  const totalPreparedToday = todayLogs.reduce((s, l) => s + l.milkPrepared, 0);
  const lastFed = logs[0];

  const stats = [
    {
      label: "Feedings today",
      value: todayLogs.length.toString(),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      color: "text-brand-600 bg-brand-50",
    },
    {
      label: "Milk prepared today",
      value: formatMl(totalPreparedToday),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Total fed today",
      value: formatMl(totalFedToday),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Avg waste",
      value: wastePercent(totalPreparedToday, totalFedToday),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "text-peach-500 bg-peach-50",
    },
    {
      label: "Last feeding",
      value: lastFed ? timeAgo(lastFed.fedAt) : "—",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
            {s.icon}
          </div>
          <div className="text-xl font-bold text-gray-800">{s.value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
