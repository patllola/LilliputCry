"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/api";
import { Milestone } from "@/types/milestone";
import { useBaby } from "@/lib/babyContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import MilestoneForm from "./MilestoneForm";
import MilestoneList from "./MilestoneList";

export default function MilestonesClient() {
  const { activeBaby, loading: babyLoading } = useBaby();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [listKey, setListKey] = useState(0);

  const fetchMilestones = useCallback(async () => {
    setFetchError(false);
    try {
      const all = await api.getMilestones(activeBaby?.id);
      setMilestones(all);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [activeBaby?.id]);

  useEffect(() => {
    if (babyLoading) return;
    fetchMilestones();
  }, [fetchMilestones, babyLoading]);

  function handleSuccess() {
    fetchMilestones();
    setListKey((k) => k + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Milestones</h1>
        <p className="text-sm text-gray-500 mt-0.5">Capture the moments worth remembering</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a milestone</CardTitle>
        </CardHeader>
        <MilestoneForm onSuccess={handleSuccess} />
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Memories</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-sm text-red-600">
            Could not load milestones. Make sure the backend is running.
          </div>
        ) : (
          <MilestoneList key={listKey} milestones={milestones} />
        )}
      </div>
    </div>
  );
}
