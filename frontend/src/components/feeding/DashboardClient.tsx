"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import { FeedingLog } from "@/types/feeding";
import StatsBar from "./StatsBar";
import FeedingCharts from "./charts";
import { useBaby } from "@/lib/babyContext";

export default function DashboardClient() {
  const { activeBaby, loading: babyLoading } = useBaby();
  const [logs, setLogs] = useState<FeedingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (babyLoading) return;
    api
      .getLogs(activeBaby?.id)
      .then(setLogs)
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [activeBaby?.id, babyLoading]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your baby&apos;s feeding stats</p>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        {/* Chart skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
        <p className="text-red-600 font-medium">Could not connect to the server.</p>
        <p className="text-sm text-red-400 mt-1">
          Make sure the backend is running at{" "}
          <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs">
            {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000"}
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your baby&apos;s feeding stats</p>
      </div>

      <StatsBar logs={logs} />

      <FeedingCharts logs={logs} />
    </div>
  );
}
