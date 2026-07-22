"use client";

import { useState } from "react";
import { Medication } from "@/types/medication";
import { api } from "@/api";
import EmptyState from "@/components/layout/EmptyState";
import { cn } from "@/lib/utils";

interface MedicationListProps {
  medications: Medication[];
}

export default function MedicationList({ medications: initial }: MedicationListProps) {
  const [medications, setMedications] = useState(initial);

  async function toggleDone(id: string) {
    const snapshot = medications;
    setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, isDoneToday: !m.isDoneToday } : m)));
    try {
      await api.toggleMedicationDone(id);
    } catch {
      setMedications(snapshot);
    }
  }

  async function toggleReminder(id: string) {
    const snapshot = medications;
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, reminderEnabled: !m.reminderEnabled } : m))
    );
    try {
      await api.toggleMedicationReminder(id);
    } catch {
      setMedications(snapshot);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this medication?")) return;
    const snapshot = medications;
    setMedications((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.deleteMedication(id);
    } catch {
      setMedications(snapshot);
      alert("Failed to delete. Please try again.");
    }
  }

  if (medications.length === 0) return <EmptyState />;

  return (
    <div className="space-y-2.5">
      {medications.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-2xl p-3"
        >
          <button
            type="button"
            onClick={() => toggleDone(m.id)}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
              m.isDoneToday ? "bg-emerald-500 text-white" : "border border-gray-200 text-transparent"
            )}
            aria-label="Toggle done"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-sm font-extrabold text-gray-800",
                m.isDoneToday && "line-through opacity-50"
              )}
            >
              {m.name}
            </div>
            <div className="text-xs font-semibold text-gray-400">
              {m.dose ? `${m.dose} · ` : ""}
              {m.timeOfDay}
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleReminder(m.id)}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
              m.reminderEnabled ? "bg-emerald-100 text-emerald-600" : "bg-gray-50 text-gray-400"
            )}
            aria-label="Toggle reminder"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleDelete(m.id)}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Delete medication"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
