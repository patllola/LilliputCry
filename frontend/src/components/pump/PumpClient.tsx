"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/api";
import { PumpSession } from "@/types/pump";
import { useBaby } from "@/lib/babyContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import PumpForm from "./PumpForm";
import PumpList from "./PumpList";

export default function PumpClient() {
  const { activeBaby, loading: babyLoading } = useBaby();
  const [sessions, setSessions] = useState<PumpSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [listKey, setListKey] = useState(0);

  const fetchSessions = useCallback(async () => {
    setFetchError(false);
    try {
      const all = await api.getPumpSessions(activeBaby?.id);
      setSessions(all);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [activeBaby?.id]);

  useEffect(() => {
    if (babyLoading) return;
    fetchSessions();
  }, [fetchSessions, babyLoading]);

  function handleSuccess() {
    fetchSessions();
    setListKey((k) => k + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Milk Pump</h1>
        <p className="text-sm text-gray-500 mt-0.5">Log left and right pumping amounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log a session</CardTitle>
        </CardHeader>
        <PumpForm onSuccess={handleSuccess} />
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
            Could not load pump sessions. Make sure the backend is running.
          </div>
        ) : (
          <PumpList key={listKey} sessions={sessions} />
        )}
      </div>
    </div>
  );
}
