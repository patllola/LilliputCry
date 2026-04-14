"use client";

import { useCallback, useEffect, useState } from "react";
import { isToday } from "date-fns";
import { api } from "@/api";
import { FeedingLog } from "@/types/feeding";
import FeedingForm from "./FeedingForm";
import FeedingList from "./FeedingList";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export default function LogFeedClient() {
  const [logs, setLogs] = useState<FeedingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [listKey, setListKey] = useState(0);

  const fetchTodayLogs = useCallback(async () => {
    setFetchError(false);
    try {
      const all = await api.getLogs();
      setLogs(all.filter((l) => isToday(new Date(l.fedAt))));
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayLogs();
  }, [fetchTodayLogs]);

  function handleSuccess() {
    fetchTodayLogs();
    setListKey((k) => k + 1); // remount FeedingList with fresh data
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Log a Feeding</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record a new feeding session</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feeding details</CardTitle>
          </CardHeader>
          <FeedingForm hideCancel onSuccess={handleSuccess} />
        </Card>
      </div>

      {/* Today's logs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Today&apos;s Logs
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-sm text-red-600">
            Could not load logs. Make sure the backend is running.
          </div>
        ) : (
          <FeedingList key={listKey} logs={logs} />
        )}
      </div>
    </div>
  );
}
