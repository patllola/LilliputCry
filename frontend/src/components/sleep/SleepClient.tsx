"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/api";
import { SleepLog } from "@/types/sleep";
import { useBaby } from "@/lib/babyContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import SleepForm from "./SleepForm";
import SleepList from "./SleepList";

export default function SleepClient() {
  const { activeBaby, loading: babyLoading } = useBaby();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [listKey, setListKey] = useState(0);

  const fetchLogs = useCallback(async () => {
    setFetchError(false);
    try {
      const all = await api.getSleepLogs(activeBaby?.id);
      setLogs(all);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [activeBaby?.id]);

  useEffect(() => {
    if (babyLoading) return;
    fetchLogs();
  }, [fetchLogs, babyLoading]);

  function handleSuccess() {
    fetchLogs();
    setListKey((k) => k + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sleep</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track naps and night sleep</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log sleep</CardTitle>
        </CardHeader>
        <SleepForm onSuccess={handleSuccess} />
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-sm text-red-600">
            Could not load sleep logs. Make sure the backend is running.
          </div>
        ) : (
          <SleepList key={listKey} logs={logs} />
        )}
      </div>
    </div>
  );
}
