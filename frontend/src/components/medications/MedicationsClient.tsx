"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/api";
import { Medication } from "@/types/medication";
import { useBaby } from "@/lib/babyContext";
import { Card } from "@/components/ui/Card";
import MedicationForm from "./MedicationForm";
import MedicationList from "./MedicationList";

export default function MedicationsClient() {
  const { activeBaby, loading: babyLoading } = useBaby();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [listKey, setListKey] = useState(0);

  const fetchMedications = useCallback(async () => {
    setFetchError(false);
    try {
      const all = await api.getMedications(activeBaby?.id);
      setMedications(all);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [activeBaby?.id]);

  useEffect(() => {
    if (babyLoading) return;
    fetchMedications();
  }, [fetchMedications, babyLoading]);

  function handleSuccess() {
    fetchMedications();
    setListKey((k) => k + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medication</h1>
        <p className="text-sm text-gray-500 mt-0.5">Keep track of doses and reminders</p>
      </div>

      <div className="flex items-center gap-2.5 bg-emerald-50 rounded-2xl px-4 py-3 text-emerald-700">
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        <span className="text-xs font-bold">Reminders on — we&apos;ll alert you at each dose time.</span>
      </div>

      <div>
        <h2 className="text-sm font-extrabold text-gray-800 mb-3">Today&apos;s schedule</h2>
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-sm text-red-600">
            Could not load medications. Make sure the backend is running.
          </div>
        ) : (
          <MedicationList key={listKey} medications={medications} />
        )}
      </div>

      <div>
        <h2 className="text-sm font-extrabold text-gray-800 mb-3">Add medication</h2>
        <Card>
          <MedicationForm onSuccess={handleSuccess} />
        </Card>
      </div>
    </div>
  );
}
